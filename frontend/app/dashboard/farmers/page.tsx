'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { Loading } from '@/components/ui/loading';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { clientAPI } from '@/lib/api';
import { toast } from 'react-hot-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Search, MapPin, Package, AlertTriangle, Users, Zap } from 'lucide-react';

interface Farmer {
  id: string;
  farmer_name: string;
  address: string;
  province: string;
  client_type: string;
  current_quantity: number;
  capacity: number;
  percentage_remaining: number;
  is_low_stock: boolean;
  is_emergency_level: boolean;
  sensor_type: string;
  is_connected: boolean;
  last_reported: string;
}

export default function FarmersPage() {
  const { isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    fetchFarmers();
  }, []);

  const fetchFarmers = async () => {
    try {
      setLoading(true);
      // Use the same data source as silo monitoring for consistency
      const feedStorageData = await clientAPI.getFeedStorage();
      setFarmers(feedStorageData);
    } catch (error) {
      toast.error('Failed to load farmers');
      console.error('Error fetching farmers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFarmers = farmers.filter(
    (farmer) =>
      farmer.farmer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      farmer.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      farmer.province.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStockStatusBadge = (farmer: Farmer) => {
    // Use backend properties for accurate status
    if (farmer.is_emergency_level) {
      return (
        <Badge variant="destructive">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Emergency
        </Badge>
      );
    } else if (farmer.is_low_stock) {
      return <Badge variant="secondary">Low Stock</Badge>;
    } else {
      return <Badge variant="default">Good Stock</Badge>;
    }
  };

  const viewFarmerDetails = (farmer: Farmer) => {
    setSelectedFarmer(farmer);
    setIsDetailOpen(true);
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <Loading message="Loading farmers..." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Farmers</h2>
            <p className="text-muted-foreground">
              Manage farmer clients and monitor their feed storage
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                         <Input
               placeholder="Search farmers by name, address, or province..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="pl-10"
             />
          </div>
        </div>

        

                 {/* Summary Cards */}
         <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Farmers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{farmers.length}</div>
              <p className="text-xs text-muted-foreground">Active clients</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Farmers with Sensors</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {farmers.filter(f => f.is_connected).length}
              </div>
              <p className="text-xs text-muted-foreground">Have BinConnect sensors</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {farmers.filter(f => f.is_low_stock && !f.is_emergency_level).length}
              </div>
              <p className="text-xs text-muted-foreground">Farmers need refill</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Emergency Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {farmers.filter(f => f.is_emergency_level).length}
              </div>
              <p className="text-xs text-muted-foreground">Critical: &lt; 0.5 tm or &lt; 10%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Stock Level</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(() => {
                  const farmersWithSensors = farmers.filter(f => f.is_connected);
                  if (farmersWithSensors.length === 0) return 0;
                  
                  const totalPercentage = farmersWithSensors.reduce(
                    (acc, f) => acc + (f.percentage_remaining || 0), 
                    0
                  );
                  return Math.round(totalPercentage / farmersWithSensors.length);
                })()}%
              </div>
              <p className="text-xs text-muted-foreground">
                {farmers.filter(f => f.is_connected).length} of {farmers.length} farmers have sensors
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Farmers Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Farmers</CardTitle>
            <CardDescription>
              A list of all registered farmers and their feed storage status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                                     <TableHead>Name</TableHead>
                   <TableHead>Location</TableHead>
                   <TableHead>Client Type</TableHead>
                   <TableHead>Feed Storage</TableHead>
                   <TableHead>Status</TableHead>
                   <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                                 {filteredFarmers.map((farmer) => (
                   <TableRow key={farmer.id}>
                     <TableCell className="font-medium">{farmer.farmer_name}</TableCell>
                     <TableCell>
                       <div className="flex items-center gap-1">
                         <MapPin className="h-3 w-3" />
                         <div>
                           <p className="text-sm">{farmer.address}</p>
                           <p className="text-xs text-muted-foreground">{farmer.province}</p>
                         </div>
                       </div>
                     </TableCell>
                     <TableCell>
                       <Badge variant="outline" className="text-xs">
                         {farmer.client_type.replace('_', ' ').toUpperCase()}
                       </Badge>
                     </TableCell>
                     <TableCell>
                       <div className="space-y-1">
                         <p className="text-sm">
                           {farmer.current_quantity} / {farmer.capacity} tm
                         </p>
                         <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                           <div
                             className={`h-full ${
                               farmer.is_emergency_level
                                 ? 'bg-red-500'
                                 : farmer.is_low_stock
                                 ? 'bg-yellow-500'
                                 : 'bg-green-500'
                             }`}
                             style={{ width: `${farmer.percentage_remaining}%` }}
                           />
                         </div>
                         <p className="text-xs text-center">{farmer.percentage_remaining.toFixed(1)}%</p>
                       </div>
                     </TableCell>
                     <TableCell>{getStockStatusBadge(farmer)}</TableCell>
                     <TableCell>
                       <Button
                         variant="outline"
                         size="sm"
                         onClick={() => viewFarmerDetails(farmer)}
                       >
                         View Details
                       </Button>
                     </TableCell>
                   </TableRow>
                 ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Farmer Detail Dialog */}
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="max-w-2xl">
                         <DialogHeader>
               <DialogTitle>{selectedFarmer?.farmer_name}</DialogTitle>
               <DialogDescription>Farmer details and feed storage information</DialogDescription>
             </DialogHeader>
             {selectedFarmer && (
               <div className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <h4 className="font-semibold mb-2">Location Information</h4>
                     <div className="space-y-2 text-sm">
                       <div className="flex items-start gap-2">
                         <MapPin className="h-4 w-4 mt-0.5" />
                         <div>
                           <p>{selectedFarmer.address}</p>
                           <p className="text-muted-foreground">{selectedFarmer.province}</p>
                         </div>
                       </div>
                       <div className="flex items-center gap-2">
                         <Badge variant="outline">
                           {selectedFarmer.client_type.replace('_', ' ').toUpperCase()}
                         </Badge>
                       </div>
                     </div>
                   </div>
                   <div>
                     <h4 className="font-semibold mb-2">Feed Storage</h4>
                     <div className="space-y-2 text-sm">
                       <p>
                         <span className="font-medium">Capacity:</span>{' '}
                         {selectedFarmer.capacity} tm
                       </p>
                       <p>
                         <span className="font-medium">Current Stock:</span>{' '}
                         {selectedFarmer.current_quantity} tm
                       </p>
                       <p>
                         <span className="font-medium">Sensor Type:</span>{' '}
                         {selectedFarmer.sensor_type.toUpperCase()}
                       </p>
                       <p>
                         <span className="font-medium">Connection Status:</span>{' '}
                         <span className={selectedFarmer.is_connected ? 'text-green-600' : 'text-red-600'}>
                           {selectedFarmer.is_connected ? 'Connected' : 'Offline'}
                         </span>
                       </p>
                       <p>
                         <span className="font-medium">Last Reported:</span>{' '}
                         {new Date(selectedFarmer.last_reported).toLocaleString()}
                       </p>
                       <div className="pt-2">{getStockStatusBadge(selectedFarmer)}</div>
                     </div>
                   </div>
                 </div>
                 <div>
                   <h4 className="font-semibold mb-2">Stock Level</h4>
                   <div className="bg-gray-100 rounded p-4">
                     <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden mb-2">
                       <div
                         className={`h-full ${
                           selectedFarmer.is_emergency_level
                             ? 'bg-red-500'
                             : selectedFarmer.is_low_stock
                             ? 'bg-yellow-500'
                             : 'bg-green-500'
                         }`}
                         style={{ width: `${selectedFarmer.percentage_remaining}%` }}
                       />
                     </div>
                     <p className="text-sm text-center">
                       {selectedFarmer.percentage_remaining.toFixed(1)}% remaining
                     </p>
                   </div>
                 </div>
               </div>
             )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
} 
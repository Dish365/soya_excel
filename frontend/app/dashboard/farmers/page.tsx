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
import { Search, MapPin, Phone, Mail, Package, AlertTriangle, Users } from 'lucide-react';

interface Farmer {
  id: string;
  name: string;
  phone_number: string;
  email?: string;
  address: string;
  latitude?: number;
  longitude?: number;
  is_active: boolean;
  created_at: string;
  feed_storage?: {
    capacity: number;
    current_quantity: number;
    percentage_remaining: number;
    is_low_stock: boolean;
    sensor_id: string;
  };
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
      const data = await clientAPI.getFarmers();
      setFarmers(data);
    } catch (error) {
      toast.error('Failed to load farmers');
      console.error('Error fetching farmers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFarmers = farmers.filter(
    (farmer) =>
      farmer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      farmer.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      farmer.phone_number.includes(searchTerm)
  );

  const getStockStatusBadge = (farmer: Farmer) => {
    if (!farmer.feed_storage) return null;
    
    const percentage = farmer.feed_storage.percentage_remaining;
    if (percentage > 50) {
      return <Badge variant="default">Good Stock</Badge>;
    } else if (percentage > 20) {
      return <Badge variant="secondary">Low Stock</Badge>;
    } else {
      return (
        <Badge variant="destructive">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Critical
        </Badge>
      );
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
              placeholder="Search farmers by name, address, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
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
              <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {farmers.filter(f => f.feed_storage?.is_low_stock).length}
              </div>
              <p className="text-xs text-muted-foreground">Farmers need refill</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Stock Level</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {farmers.length > 0
                  ? Math.round(
                      farmers.reduce((acc, f) => acc + (f.feed_storage?.percentage_remaining || 0), 0) /
                        farmers.length
                    )
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">Across all farmers</p>
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
                  <TableHead>Contact</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Feed Storage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFarmers.map((farmer) => (
                  <TableRow key={farmer.id}>
                    <TableCell className="font-medium">{farmer.name}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3" />
                          {farmer.phone_number}
                        </div>
                        {farmer.email && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {farmer.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {farmer.address}
                      </div>
                    </TableCell>
                    <TableCell>
                      {farmer.feed_storage ? (
                        <div className="space-y-1">
                          <p className="text-sm">
                            {farmer.feed_storage.current_quantity} / {farmer.feed_storage.capacity} kg
                          </p>
                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                farmer.feed_storage.percentage_remaining > 50
                                  ? 'bg-green-500'
                                  : farmer.feed_storage.percentage_remaining > 20
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                              }`}
                              style={{ width: `${farmer.feed_storage.percentage_remaining}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No sensor</span>
                      )}
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
              <DialogTitle>{selectedFarmer?.name}</DialogTitle>
              <DialogDescription>Farmer details and feed storage information</DialogDescription>
            </DialogHeader>
            {selectedFarmer && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Contact Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {selectedFarmer.phone_number}
                      </div>
                      {selectedFarmer.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {selectedFarmer.email}
                        </div>
                      )}
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 mt-0.5" />
                        {selectedFarmer.address}
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Feed Storage</h4>
                    {selectedFarmer.feed_storage ? (
                      <div className="space-y-2 text-sm">
                        <p>
                          <span className="font-medium">Capacity:</span>{' '}
                          {selectedFarmer.feed_storage.capacity} kg
                        </p>
                        <p>
                          <span className="font-medium">Current Stock:</span>{' '}
                          {selectedFarmer.feed_storage.current_quantity} kg
                        </p>
                        <p>
                          <span className="font-medium">Sensor ID:</span>{' '}
                          {selectedFarmer.feed_storage.sensor_id}
                        </p>
                        <div className="pt-2">{getStockStatusBadge(selectedFarmer)}</div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No feed storage sensor configured</p>
                    )}
                  </div>
                </div>
                {selectedFarmer.latitude && selectedFarmer.longitude && (
                  <div>
                    <h4 className="font-semibold mb-2">Location</h4>
                    <div className="bg-gray-100 rounded p-4 text-sm">
                      <p>Latitude: {selectedFarmer.latitude}</p>
                      <p>Longitude: {selectedFarmer.longitude}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
} 
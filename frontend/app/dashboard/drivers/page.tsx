'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { Loading } from '@/components/ui/loading';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { driverAPI } from '@/lib/api';
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
import { 
  Search, 
  Phone, 
  Mail, 
  Truck, 
  UserCheck, 
  Package,
  Clock,
  Settings
} from 'lucide-react';
import { format } from 'date-fns';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Vehicle {
  id: string;
  vehicle_number: string;
  vehicle_type: string;
  capacity_tonnes: number;
  status: string;
  make_model?: string;
  year?: number;
}

interface Driver {
  id: string;
  staff_id: string;
  full_name: string;
  phone_number: string;
  license_number: string;
  vehicle_number?: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
  assigned_vehicle_info?: {
    id: string;
    vehicle_number: string;
    vehicle_type: string;
    capacity_tonnes: number;
    status: string;
  };
  current_delivery_status?: {
    status: string;
    route_name: string;
    delivery_id: string;
  };
  user: {
    email: string;
    username: string;
  };
  deliveries?: {
    total: number;
    completed: number;
    in_progress: number;
  };
}

interface Delivery {
  id: string;
  driver: number;
  route: {
    name: string;
    date: string;
  };
  status: string;
  assigned_date: string;
  start_time?: string;
  end_time?: string;
  total_quantity_delivered: number;
}

export default function DriversPage() {
  const { isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [driverDeliveries, setDriverDeliveries] = useState<Delivery[]>([]);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [filterAvailable, setFilterAvailable] = useState<boolean | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');

  useEffect(() => {
    fetchDrivers();
    fetchVehicles();
  }, []);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const data = await driverAPI.getDrivers();
      setDrivers(data);
    } catch (error) {
      toast.error('Failed to load drivers');
      console.error('Error fetching drivers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      const data = await driverAPI.getAvailableVehicles();
      setVehicles(data);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
  };

  const fetchDriverDeliveries = async (driverId: string) => {
    try {
      const deliveries = await driverAPI.getDriverDeliveries(driverId);
      setDriverDeliveries(deliveries);
    } catch (error) {
      console.error('Error fetching driver deliveries:', error);
      toast.error('Failed to load driver deliveries');
    }
  };

  const toggleDriverAvailability = async (driver: Driver) => {
    try {
      await driverAPI.toggleDriverAvailability(driver.id);
      await fetchDrivers();
      toast.success(`Driver ${driver.full_name} availability updated successfully`);
    } catch (error) {
      console.error('Error updating driver availability:', error);
      toast.error('Failed to update driver availability');
    }
  };

  const filteredDrivers = drivers.filter((driver) => {
    const matchesSearch = 
      driver.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.staff_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.vehicle_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.phone_number.includes(searchTerm);
    
    const matchesAvailability = 
      filterAvailable === null || driver.is_available === filterAvailable;
    
    return matchesSearch && matchesAvailability;
  });

  const viewDriverDetails = async (driver: Driver) => {
    setSelectedDriver(driver);
    await fetchDriverDeliveries(driver.id);
    setIsDetailOpen(true);
  };

  const assignVehicleToDriver = async (driverId: string, vehicleId: string) => {
    try {
      await driverAPI.assignVehicleToDriver(driverId, vehicleId);
      await fetchDrivers();
      await fetchVehicles();
      setSelectedVehicleId('');
      toast.success('Vehicle assigned successfully');
    } catch (error) {
      console.error('Error assigning vehicle:', error);
      toast.error('Failed to assign vehicle');
    }
  };

  const unassignVehicleFromDriver = async (driver: Driver) => {
    try {
      await driverAPI.unassignVehicleFromDriver(driver.id);
      await fetchDrivers();
      await fetchVehicles();
      toast.success(`Vehicle unassigned from ${driver.full_name} successfully`);
    } catch (error) {
      console.error('Error unassigning vehicle:', error);
      toast.error('Failed to unassign vehicle');
    }
  };

  const openVehicleAssignment = (driver: Driver) => {
    setSelectedDriver(driver);
    setSelectedVehicleId('');
    setIsDetailOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline" | null> = {
      assigned: 'secondary',
      in_progress: 'default',
      completed: 'default',
      cancelled: 'destructive',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <Loading message="Loading drivers..." />
      </DashboardLayout>
    );
  }

  const availableDrivers = drivers.filter(d => d.is_available);
  const totalDeliveries = drivers.reduce((acc, d) => acc + (d.deliveries?.total || 0), 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Drivers</h2>
            <p className="text-muted-foreground">
              Manage delivery drivers and monitor their performance
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search drivers by name, ID, or vehicle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label>Availability:</Label>
            <Button
              variant={filterAvailable === null ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterAvailable(null)}
            >
              All
            </Button>
            <Button
              variant={filterAvailable === true ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterAvailable(true)}
            >
              Available
            </Button>
            <Button
              variant={filterAvailable === false ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterAvailable(false)}
            >
              Unavailable
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Drivers</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{drivers.length}</div>
              <p className="text-xs text-muted-foreground">Registered drivers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{availableDrivers.length}</div>
              <p className="text-xs text-muted-foreground">Ready for delivery</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Deliveries</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalDeliveries}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Availability Rate</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {drivers.length > 0 
                  ? Math.round((availableDrivers.length / drivers.length) * 100)
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">Currently available</p>
            </CardContent>
          </Card>
        </div>

        {/* Drivers Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Drivers</CardTitle>
            <CardDescription>
              Manage driver availability and view their delivery history
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Availability</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDrivers.map((driver) => (
                  <TableRow key={driver.id}>
                    <TableCell className="font-medium">{driver.staff_id}</TableCell>
                    <TableCell>{driver.full_name}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3" />
                          {driver.phone_number}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {driver.user.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {driver.assigned_vehicle_info ? (
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{driver.assigned_vehicle_info.vehicle_number}</Badge>
                          <Badge variant="secondary">{driver.assigned_vehicle_info.vehicle_type}</Badge>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No vehicle assigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={driver.is_available ? "default" : "secondary"}>
                        {driver.is_available ? 'Available' : 'Unavailable'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={driver.is_available}
                        onCheckedChange={() => toggleDriverAvailability(driver)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => viewDriverDetails(driver)}
                        >
                          View Details
                        </Button>
                        {driver.assigned_vehicle_info ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => unassignVehicleFromDriver(driver)}
                          >
                            Unassign Vehicle
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openVehicleAssignment(driver)}
                          >
                            <Settings className="h-4 w-4 mr-1" />
                            Assign Vehicle
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Driver Detail Dialog */}
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{selectedDriver?.full_name}</DialogTitle>
              <DialogDescription>Driver details and delivery history</DialogDescription>
            </DialogHeader>
            {selectedDriver && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Driver Information</h4>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Staff ID:</span> {selectedDriver.staff_id}</p>
                      <p><span className="font-medium">License:</span> {selectedDriver.license_number}</p>
                      <p><span className="font-medium">Vehicle:</span> {selectedDriver.assigned_vehicle_info?.vehicle_number || 'Not assigned'}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Contact</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {selectedDriver.phone_number}
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {selectedDriver.user.email}
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Status</h4>
                    <div className="space-y-2">
                      <Badge variant={selectedDriver.is_available ? "default" : "secondary"}>
                        {selectedDriver.is_available ? 'Available' : 'Unavailable'}
                      </Badge>
                      <p className="text-sm text-muted-foreground">
                        Joined: {format(new Date(selectedDriver.created_at), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Recent Deliveries */}
                <div>
                  <h4 className="font-semibold mb-2">Recent Deliveries</h4>
                  {driverDeliveries.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Route</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Quantity</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {driverDeliveries.slice(0, 5).map((delivery) => (
                          <TableRow key={delivery.id}>
                            <TableCell>{delivery.route.name}</TableCell>
                            <TableCell>
                              {format(new Date(delivery.assigned_date), 'MMM dd, yyyy')}
                            </TableCell>
                            <TableCell>{getStatusBadge(delivery.status)}</TableCell>
                            <TableCell>{delivery.total_quantity_delivered} kg</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-sm text-muted-foreground">No delivery history</p>
                  )}
                </div>

                {/* Vehicle Assignment Form */}
                {selectedDriver && (
                  <div className="mt-6">
                    <h4 className="font-semibold mb-2">Assign Vehicle</h4>
                    <Select onValueChange={(value) => setSelectedVehicleId(value)} value={selectedVehicleId}>
                      <SelectTrigger id="vehicle">
                        <SelectValue placeholder="Select a vehicle" />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicles.map((vehicle) => (
                          <SelectItem key={vehicle.id} value={vehicle.id}>
                            {vehicle.vehicle_number} ({vehicle.vehicle_type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                                         <Button
                       className="mt-4"
                       onClick={() => {
                         if (selectedDriver?.id && selectedVehicleId) {
                           assignVehicleToDriver(selectedDriver.id, selectedVehicleId);
                         } else {
                           toast.error('Driver or Vehicle not selected.');
                         }
                       }}
                       disabled={!selectedVehicleId}
                     >
                       Assign Vehicle
                     </Button>
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
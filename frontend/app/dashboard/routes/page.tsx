'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { Loading } from '@/components/ui/loading';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { routeAPI } from '@/lib/api';
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
  MapPin, 
  Truck,
  Calendar,
  Navigation,
  Package,
  CheckCircle,
  type LucideIcon
} from 'lucide-react';
import { format } from 'date-fns';

interface RouteStop {
  id: string;
  farmer: {
    id: string;
    name: string;
    address: string;
  };
  order: {
    id: string;
    order_number: string;
    quantity: number;
  };
  sequence_number: number;
  estimated_arrival_time?: string;
  is_completed: boolean;
}

interface Route {
  id: string;
  name: string;
  date: string;
  status: 'draft' | 'planned' | 'active' | 'completed' | 'cancelled';
  total_distance?: number;
  estimated_duration?: number;
  created_at: string;
  stops: RouteStop[];
  created_by: {
    username: string;
  };
}

export default function RoutesPage() {
  const { isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      const data = await routeAPI.getRoutes();
      setRoutes(data);
    } catch (error) {
      toast.error('Failed to load routes');
      console.error('Error fetching routes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRoutes = routes.filter((route) => {
    const matchesSearch = 
      route.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      route.date.includes(searchTerm);
    
    const matchesStatus = filterStatus === 'all' || route.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", icon?: LucideIcon }> = {
      draft: { variant: 'secondary' },
      planned: { variant: 'outline' },
      active: { variant: 'default', icon: Truck },
      completed: { variant: 'default', icon: CheckCircle },
      cancelled: { variant: 'destructive' },
    };
    
    const config = variants[status] || { variant: 'default' };
    return (
      <Badge variant={config.variant}>
        {config.icon && <config.icon className="h-3 w-3 mr-1" />}
        {status}
      </Badge>
    );
  };

  const viewRouteDetails = (route: Route) => {
    setSelectedRoute(route);
    setIsDetailOpen(true);
  };

  const optimizeRoute = async (routeId: string) => {
    try {
      await routeAPI.optimizeRoute(parseInt(routeId));
      toast.success('Route optimized successfully');
      fetchRoutes();
    } catch {
      toast.error('Failed to optimize route');
    }
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <Loading message="Loading routes..." />
      </DashboardLayout>
    );
  }

  const activeRoutes = routes.filter(r => r.status === 'active');
  const todayRoutes = routes.filter(r => 
    new Date(r.date).toDateString() === new Date().toDateString()
  );
  const totalStops = routes.reduce((acc, route) => acc + (route.stops?.length || 0), 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Routes</h2>
            <p className="text-muted-foreground">
              Plan and monitor delivery routes
            </p>
          </div>
          <Button>
            <Navigation className="h-4 w-4 mr-2" />
            Plan New Route
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search routes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'draft', 'planned', 'active', 'completed'].map((status) => (
              <Button
                key={status}
                variant={filterStatus === status ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus(status)}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Routes</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{routes.length}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Routes</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeRoutes.length}</div>
              <p className="text-xs text-muted-foreground">Currently in progress</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today&apos;s Routes</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayRoutes.length}</div>
              <p className="text-xs text-muted-foreground">Scheduled for today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Stops</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStops}</div>
              <p className="text-xs text-muted-foreground">Across all routes</p>
            </CardContent>
          </Card>
        </div>

        {/* Routes Table */}
        <Card>
          <CardHeader>
            <CardTitle>Delivery Routes</CardTitle>
            <CardDescription>
              View and manage delivery route schedules
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Route Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Stops</TableHead>
                  <TableHead>Distance</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRoutes.map((route) => (
                  <TableRow key={route.id}>
                    <TableCell className="font-medium">{route.name}</TableCell>
                    <TableCell>{format(new Date(route.date), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>{route.stops?.length || 0} stops</TableCell>
                    <TableCell>
                      {route.total_distance ? `${route.total_distance} km` : '-'}
                    </TableCell>
                    <TableCell>
                      {route.estimated_duration 
                        ? `${Math.floor(route.estimated_duration / 60)}h ${route.estimated_duration % 60}m`
                        : '-'
                      }
                    </TableCell>
                    <TableCell>{getStatusBadge(route.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => viewRouteDetails(route)}
                        >
                          View
                        </Button>
                        {route.status === 'planned' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => optimizeRoute(route.id)}
                          >
                            Optimize
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

        {/* Route Detail Dialog */}
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{selectedRoute?.name}</DialogTitle>
              <DialogDescription>
                Route details and delivery stops
              </DialogDescription>
            </DialogHeader>
            {selectedRoute && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium">Date</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(selectedRoute.date), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Total Distance</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedRoute.total_distance ? `${selectedRoute.total_distance} km` : 'Not calculated'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Estimated Duration</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedRoute.estimated_duration 
                        ? `${Math.floor(selectedRoute.estimated_duration / 60)}h ${selectedRoute.estimated_duration % 60}m`
                        : 'Not calculated'
                      }
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Delivery Stops</h4>
                  {selectedRoute.stops?.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Seq</TableHead>
                          <TableHead>Farmer</TableHead>
                          <TableHead>Address</TableHead>
                          <TableHead>Order</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedRoute.stops.map((stop) => (
                          <TableRow key={stop.id}>
                            <TableCell>{stop.sequence_number}</TableCell>
                            <TableCell>{stop.farmer.name}</TableCell>
                            <TableCell>{stop.farmer.address}</TableCell>
                            <TableCell>{stop.order.order_number}</TableCell>
                            <TableCell>{stop.order.quantity} kg</TableCell>
                            <TableCell>
                              <Badge variant={stop.is_completed ? "default" : "secondary"}>
                                {stop.is_completed ? 'Completed' : 'Pending'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-sm text-muted-foreground">No stops added to this route</p>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
} 
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Plus, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'react-hot-toast';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { clientAPI, driverAPI } from '@/lib/api';
import type { ControllerRenderProps } from 'react-hook-form';
import { useAuth } from '@/lib/hooks/useAuth';
import { Loading } from '@/components/ui/loading';

// Types
interface Farmer {
  id: string;
  name: string;
  address: string;
}

interface Driver {
  id: string;
  full_name: string;
  vehicle_number: string;
}

interface Order {
  id: string;
  order_number: string;
  farmer_name: string;
  quantity: number;
  status: string;
  order_date: string;
  expected_delivery_date?: string;
}

const orderSchema = z.object({
  farmer: z.string().min(1, 'Please select a farmer'),
  quantity: z.string().min(1, 'Quantity is required'),
  expectedDeliveryDate: z.date({
    required_error: 'Expected delivery date is required',
  }),
  driver: z.string().optional(),
  notes: z.string().optional(),
});

type OrderFormData = z.infer<typeof orderSchema>;

export default function OrdersPage() {
  const { isLoading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      farmer: '',
      quantity: '',
      notes: '',
    },
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ordersData, farmersData, driversData] = await Promise.all([
        clientAPI.getOrders(),
        clientAPI.getFarmers(),
        driverAPI.getAvailableDrivers(),
      ]);
      
      setOrders(ordersData);
      setFarmers(farmersData);
      setDrivers(driversData);
    } catch (error) {
      toast.error('Failed to load data');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: OrderFormData) => {
    try {
      // Generate order number
      const orderNumber = `ORD-${Date.now()}`;
      
      const orderData = {
        farmer: data.farmer,
        order_number: orderNumber,
        quantity: parseFloat(data.quantity),
        expected_delivery_date: data.expectedDeliveryDate.toISOString(),
        notes: data.notes,
      };

      await clientAPI.createOrder(orderData);
      
      // Note: Driver assignment requires a route to be created first
      // This functionality will be available from the routes page
      if (data.driver) {
        toast('Driver noted. Please create a route to assign deliveries.', {
          icon: 'ℹ️',
        });
      }

      toast.success('Order created successfully');
      setIsCreateOpen(false);
      form.reset();
      fetchData();
    } catch (error) {
      toast.error('Failed to create order');
      console.error('Error creating order:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline" | null> = {
      pending: 'secondary',
      confirmed: 'default',
      in_transit: 'default',
      delivered: 'default',
      cancelled: 'destructive',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.farmer_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || order.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <Loading message="Loading orders..." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Orders</h2>
            <p className="text-muted-foreground">
              Manage and schedule feed deliveries
            </p>
          </div>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Order
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>Create New Order</DialogTitle>
                <DialogDescription>
                  Schedule a new feed delivery order for a farmer
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="farmer"
                    render={({ field }: { field: ControllerRenderProps<OrderFormData, "farmer"> }) => (
                      <FormItem>
                        <FormLabel>Farmer</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a farmer" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {farmers.map((farmer) => (
                              <SelectItem key={farmer.id} value={farmer.id.toString()}>
                                {farmer.name} - {farmer.address}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }: { field: ControllerRenderProps<OrderFormData, "quantity"> }) => (
                      <FormItem>
                        <FormLabel>Quantity (kg)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Enter quantity in kg"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="expectedDeliveryDate"
                    render={({ field }: { field: ControllerRenderProps<OrderFormData, "expectedDeliveryDate"> }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Expected Delivery Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date: Date) =>
                                date < new Date() || date < new Date("1900-01-01")
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="driver"
                    render={({ field }: { field: ControllerRenderProps<OrderFormData, "driver"> }) => (
                      <FormItem>
                        <FormLabel>Assign Driver (Optional)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a driver" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">No driver assigned</SelectItem>
                            {drivers.map((driver) => (
                              <SelectItem key={driver.id} value={driver.id.toString()}>
                                {driver.full_name} - {driver.vehicle_number}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          You can assign a driver now or later
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }: { field: ControllerRenderProps<OrderFormData, "notes"> }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Add any special instructions..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button type="submit">Create Order</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="in_transit">In Transit</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Orders</CardTitle>
            <CardDescription>
              A list of all feed delivery orders
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Farmer</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Order Date</TableHead>
                  <TableHead>Expected Delivery</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.order_number}</TableCell>
                    <TableCell>{order.farmer_name}</TableCell>
                    <TableCell>{order.quantity} kg</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>{format(new Date(order.order_date), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>
                      {order.expected_delivery_date 
                        ? format(new Date(order.expected_delivery_date), 'MMM dd, yyyy')
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">View</Button>
                        <Button variant="outline" size="sm">Edit</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
} 
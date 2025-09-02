'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Plus, Search, Package, AlertTriangle } from 'lucide-react';
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
import { clientAPI } from '@/lib/api';
import type { ControllerRenderProps } from 'react-hook-form';
import { useAuth } from '@/lib/hooks/useAuth';
import { Loading } from '@/components/ui/loading';

// Types
interface Farmer {
  id: string;
  name: string;
  address: string;
  province: string;
  client_type: string;
  phone_number: string;
  email?: string;
}

interface Order {
  id: string;
  order_number: string;
  expedition_number: string;
  farmer: string; // This is the farmer ID
  farmer_name: string; // This is the actual farmer name from serializer
  farmer_address: string; // This is the farmer address from serializer
  quantity: number;
  delivery_method: string;
  order_type: string;
  status: string;
  order_date: string;
  expected_delivery_date?: string;
  actual_delivery_date?: string;
  notes?: string;
  forecast_based: boolean;
  planning_week?: string;
  priority?: string;
  is_urgent?: boolean;
  requires_approval?: boolean;
  available_actions?: string[];
}

const orderSchema = z.object({
  farmer: z.string().min(1, 'Please select a farmer'),
  quantity: z.string().min(1, 'Quantity is required'),
  deliveryMethod: z.string().min(1, 'Please select a delivery method'),
  orderType: z.string().min(1, 'Please select an order type'),
  expectedDeliveryDate: z.date({
    required_error: 'Expected delivery date is required',
  }),
  notes: z.string().optional(),
});

type OrderFormData = z.infer<typeof orderSchema>;

const planningSchema = z.object({
  planning_week: z.string().min(1, 'Planning week is required'),
  notes: z.string().optional(),
});

type PlanningFormData = z.infer<typeof planningSchema>;

export default function OrdersPage() {
  const { isLoading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [farmers, setFarmers] = useState<Farmer[]>([]);

  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      farmer: '',
      quantity: '',
      deliveryMethod: 'bulk_38tm',
      orderType: 'on_demand',
      notes: '',
    },
  });

  const editForm = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      farmer: '',
      quantity: '',
      deliveryMethod: 'bulk_38tm',
      orderType: 'on_demand',
      notes: '',
    },
  });

  const planningForm = useForm<PlanningFormData>({
    resolver: zodResolver(planningSchema),
    defaultValues: {
      planning_week: '',
      notes: '',
    },
  });

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPlanningOpen, setIsPlanningOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ordersData, farmersData] = await Promise.all([
        clientAPI.getOrders(),
        clientAPI.getFarmers(),
      ]);
      
      setOrders(ordersData);
      setFarmers(farmersData);
      // TODO: Add driver loading when needed
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
        delivery_method: data.deliveryMethod,
        order_type: data.orderType,
        expected_delivery_date: data.expectedDeliveryDate.toISOString(),
        notes: data.notes,
      };

      await clientAPI.createOrder(orderData);
      


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
      planned: 'default',
      in_transit: 'default',
      delivered: 'default',
      cancelled: 'destructive',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };



  const viewOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsViewOpen(true);
  };

  const editOrder = (order: Order) => {
    setSelectedOrder(order);
    editForm.reset({
      farmer: order.farmer,
      quantity: order.quantity.toString(),
      deliveryMethod: order.delivery_method,
      orderType: order.order_type,
      notes: order.notes || '',
      expectedDeliveryDate: order.expected_delivery_date ? new Date(order.expected_delivery_date) : undefined,
    });
    setIsEditOpen(true);
  };

  const onEditSubmit = async (data: OrderFormData) => {
    if (!selectedOrder) return;
    
    try {
      const orderData = {
        quantity: parseFloat(data.quantity),
        delivery_method: data.deliveryMethod,
        order_type: data.orderType,
        expected_delivery_date: data.expectedDeliveryDate.toISOString(),
        notes: data.notes,
      };

      await clientAPI.updateOrder(selectedOrder.id, orderData);
      toast.success(`Order ${selectedOrder.order_number} updated successfully`);
      setIsEditOpen(false);
      setSelectedOrder(null);
      fetchData();
    } catch (error) {
      toast.error('Failed to update order');
      console.error('Error updating order:', error);
    }
  };

  const onPlanningSubmit = async (data: PlanningFormData) => {
    if (!selectedOrder) return;
    
    try {
      // TODO: Implement planning API call with data.planning_week
      toast.success(`Order ${selectedOrder.order_number} planned for week ${data.planning_week}`);
      setIsPlanningOpen(false);
      setSelectedOrder(null);
      fetchData();
    } catch (error) {
      toast.error('Failed to plan order');
      console.error('Error planning order:', error);
    }
  };

  const handleOrderAction = async (order: Order, action: string) => {
    try {
      switch (action) {
        case 'confirm':
          await clientAPI.confirmOrder(order.id);
          toast.success(`Order ${order.order_number} confirmed successfully`);
          break;
        case 'approve':
          await clientAPI.approveOrder(order.id);
          toast.success(`Order ${order.order_number} approved successfully`);
          break;
        case 'plan':
          setSelectedOrder(order);
          setIsPlanningOpen(true);
          break;
        case 'assign_route':
          // TODO: Implement route assignment dialog
          toast(`Assigning route for order ${order.order_number}`, { icon: 'ℹ️' });
          break;
        case 'mark_delivered':
          await clientAPI.updateOrderStatus(order.id, 'delivered');
          toast.success(`Order ${order.order_number} marked as delivered`);
          break;
        case 'cancel':
          await clientAPI.updateOrderStatus(order.id, 'cancelled');
          toast.success(`Order ${order.order_number} cancelled successfully`);
          break;
        default:
          toast(`Action ${action} not implemented yet`, { icon: 'ℹ️' });
      }
      fetchData(); // Refresh data after action
    } catch (error) {
      toast.error(`Failed to ${action} order`);
      console.error(`Error ${action}ing order:`, error);
    }
  };

  const getActionButtons = (order: Order) => {
    const actions = order.available_actions || [];
    
    return (
      <div className="flex gap-2 flex-wrap">
        <Button variant="outline" size="sm" onClick={() => viewOrderDetails(order)}>
          View
        </Button>
        {actions.includes('edit') && (
          <Button variant="outline" size="sm" onClick={() => editOrder(order)}>
            Edit
          </Button>
        )}
        {actions.includes('confirm') && (
          <Button variant="default" size="sm" onClick={() => handleOrderAction(order, 'confirm')}>
            Confirm
          </Button>
        )}
        {actions.includes('approve') && (
          <Button variant="default" size="sm" onClick={() => handleOrderAction(order, 'approve')}>
            Approve
          </Button>
        )}
        {actions.includes('plan') && (
          <Button variant="default" size="sm" onClick={() => handleOrderAction(order, 'plan')}>
            Plan
          </Button>
        )}
        {actions.includes('assign_route') && (
          <Button variant="default" size="sm" onClick={() => handleOrderAction(order, 'assign_route')}>
            Assign Route
          </Button>
        )}
        {actions.includes('mark_delivered') && (
          <Button variant="default" size="sm" onClick={() => handleOrderAction(order, 'mark_delivered')}>
            Mark Delivered
          </Button>
        )}
        {actions.includes('cancel') && (
          <Button variant="destructive" size="sm" onClick={() => handleOrderAction(order, 'cancel')}>
            Cancel
          </Button>
        )}
      </div>
    );
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.farmer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.expedition_number.toLowerCase().includes(searchTerm.toLowerCase());
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
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchData}>
              <Search className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            
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
                                {farmer.name} - {farmer.province} ({farmer.client_type.replace('_', ' ')})
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
                        <FormLabel>Quantity (tonnes)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            min="0.1"
                            placeholder="Enter quantity in tonnes"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Enter quantity in tonnes (e.g., 2.5 for 2.5 tonnes)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="deliveryMethod"
                    render={({ field }: { field: ControllerRenderProps<OrderFormData, "deliveryMethod"> }) => (
                      <FormItem>
                        <FormLabel>Delivery Method</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select delivery method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="bulk_38tm">Bulk Truck (38 tm)</SelectItem>
                            <SelectItem value="tank_compartment">Tank Compartments (2-10 tm)</SelectItem>
                            <SelectItem value="tote_500kg">Tote Bags 500kg</SelectItem>
                            <SelectItem value="tote_1000kg">Tote Bags 1000kg</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="orderType"
                    render={({ field }: { field: ControllerRenderProps<OrderFormData, "orderType"> }) => (
                      <FormItem>
                        <FormLabel>Order Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select order type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="contract">Contract Delivery</SelectItem>
                            <SelectItem value="on_demand">On-Demand</SelectItem>
                            <SelectItem value="emergency">Emergency Refill</SelectItem>
                            <SelectItem value="proactive">Proactive Based on Forecast</SelectItem>
                          </SelectContent>
                        </Select>
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
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orders.length}</div>
              <p className="text-xs text-muted-foreground">All time orders</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {orders.filter(o => o.status === 'pending').length}
              </div>
              <p className="text-xs text-muted-foreground">Awaiting confirmation</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Transit</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {orders.filter(o => o.status === 'in_transit').length}
              </div>
              <p className="text-xs text-muted-foreground">Currently delivering</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Delivered Today</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {orders.filter(o => {
                  if (o.status === 'delivered' && o.actual_delivery_date) {
                    const today = new Date().toDateString();
                    return new Date(o.actual_delivery_date).toDateString() === today;
                  }
                  return false;
                }).length}
              </div>
              <p className="text-xs text-muted-foreground">Completed today</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by order #, expedition #, or farmer name..."
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
              <SelectItem value="planned">Planned</SelectItem>
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
                    <TableHead>Expedition #</TableHead>
                    <TableHead>Farmer</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Delivery Method</TableHead>
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
                    <TableCell className="text-sm text-muted-foreground">{order.expedition_number}</TableCell>
                                         <TableCell>
                       <div>
                         <div className="font-medium">{order.farmer_name}</div>
                         <div className="text-xs text-muted-foreground">{order.farmer_address}</div>
                       </div>
                     </TableCell>
                    <TableCell>{order.quantity} tm</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {order.delivery_method.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>{format(new Date(order.order_date), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>
                      {order.expected_delivery_date 
                        ? format(new Date(order.expected_delivery_date), 'MMM dd, yyyy')
                        : '-'
                      }
                    </TableCell>
                                         <TableCell>
                       {getActionButtons(order)}
                     </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Order Details View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              Detailed information about order {selectedOrder?.order_number}
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Header */}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold">{selectedOrder.order_number}</h3>
                  <p className="text-muted-foreground">Expedition: {selectedOrder.expedition_number}</p>
                </div>
                <div className="text-right">
                  {getStatusBadge(selectedOrder.status)}
                  <p className="text-sm text-muted-foreground mt-1">
                    Created {format(new Date(selectedOrder.order_date), 'MMM dd, yyyy')}
                  </p>
                </div>
              </div>

              {/* Order Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Quantity</label>
                    <p className="text-lg font-semibold">{selectedOrder.quantity} tonnes</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Delivery Method</label>
                    <p className="text-sm">{selectedOrder.delivery_method.replace('_', ' ').toUpperCase()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Order Type</label>
                    <p className="text-sm">{selectedOrder.order_type.replace('_', ' ').toUpperCase()}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Expected Delivery</label>
                    <p className="text-sm">
                      {selectedOrder.expected_delivery_date 
                        ? format(new Date(selectedOrder.expected_delivery_date), 'MMM dd, yyyy')
                        : 'Not set'
                      }
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Priority</label>
                    <p className="text-sm">{selectedOrder.priority || 'Medium'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Urgent</label>
                    <p className="text-sm">{selectedOrder.is_urgent ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              </div>

              {/* Farmer Information */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Farmer Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Name</label>
                    <p className="font-medium">{selectedOrder.farmer_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Address</label>
                    <p className="text-sm">{selectedOrder.farmer_address}</p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Notes</h4>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                    {selectedOrder.notes}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Available Actions</h4>
                <div className="flex gap-2 flex-wrap">
                  {getActionButtons(selectedOrder)}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Order Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Order</DialogTitle>
            <DialogDescription>
              Modify order {selectedOrder?.order_number}
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="quantity"
                    render={({ field }: { field: ControllerRenderProps<OrderFormData, "quantity"> }) => (
                      <FormItem>
                        <FormLabel>Quantity (tonnes)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            min="0.1"
                            placeholder="Enter quantity in tonnes"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="deliveryMethod"
                    render={({ field }: { field: ControllerRenderProps<OrderFormData, "deliveryMethod"> }) => (
                      <FormItem>
                        <FormLabel>Delivery Method</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select delivery method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="bulk_38tm">Bulk Truck (38 tm)</SelectItem>
                            <SelectItem value="tank_compartment">Tank Compartments (2-10 tm)</SelectItem>
                            <SelectItem value="tote_500kg">Tote Bags 500kg</SelectItem>
                            <SelectItem value="tote_1000kg">Tote Bags 1000kg</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="orderType"
                    render={({ field }: { field: ControllerRenderProps<OrderFormData, "orderType"> }) => (
                      <FormItem>
                        <FormLabel>Order Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select order type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="contract">Contract Delivery</SelectItem>
                            <SelectItem value="on_demand">On-Demand</SelectItem>
                            <SelectItem value="emergency">Emergency Refill</SelectItem>
                            <SelectItem value="proactive">Proactive Based on Forecast</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
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
                </div>

                <FormField
                  control={editForm.control}
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
                  <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Update Order</Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      {/* Planning Dialog */}
      <Dialog open={isPlanningOpen} onOpenChange={setIsPlanningOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Plan Order for Delivery</DialogTitle>
            <DialogDescription>
              Schedule order {selectedOrder?.order_number} for delivery
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <Form {...planningForm}>
              <form onSubmit={planningForm.handleSubmit(onPlanningSubmit)} className="space-y-4">
                <FormField
                  control={planningForm.control}
                  name="planning_week"
                  render={({ field }: { field: ControllerRenderProps<PlanningFormData, "planning_week"> }) => (
                    <FormItem>
                      <FormLabel>Planning Week</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., 2024-W45 or 2024-11-11"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Enter the planning week in format YYYY-WNN or specific date
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={planningForm.control}
                  name="notes"
                  render={({ field }: { field: ControllerRenderProps<PlanningFormData, "notes"> }) => (
                    <FormItem>
                      <FormLabel>Planning Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add any planning notes or special instructions..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsPlanningOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Plan Order</Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
} 
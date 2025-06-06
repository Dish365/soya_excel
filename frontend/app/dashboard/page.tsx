'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Users,
  Truck,
  Package,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import { io } from 'socket.io-client';
import { clientAPI, managerAPI } from '@/lib/api';
import { useDashboardStore } from '@/lib/store';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { useAuth } from '@/lib/hooks/useAuth';

// Types
interface StatsCardProps {
  title: string;
  value: number | string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: string;
}

interface FeedItem {
  id: string;
  farmer_name: string;
  address: string;
  current_quantity: number;
  capacity: number;
  percentage_remaining: number;
  is_low_stock: boolean;
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

interface InventoryItem {
  id: string;
  product_name: string;
  current_stock: number;
  minimum_stock: number;
  is_low_stock: boolean;
}

interface DashboardData {
  total_farmers: number;
  available_drivers: number;
  pending_orders: number;
  low_stock_alerts: number;
  orders_trend?: string;
  inventory_status: InventoryItem[];
  active_routes: number;
  monthly_deliveries: number;
}

// Stats Card Component
function StatsCard({ title, value, description, icon: Icon, trend }: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {trend && (
          <div className="flex items-center pt-1">
            <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
            <span className="text-xs text-green-600">{trend}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Feed Storage Monitor Component
interface FeedStorageMonitorProps {
  feedData: FeedItem[];
}

function FeedStorageMonitor({ feedData }: FeedStorageMonitorProps) {
  const getStatusColor = (percentage: number) => {
    if (percentage > 50) return 'bg-green-500';
    if (percentage > 20) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feed Storage Monitor</CardTitle>
        <CardDescription>Real-time feed levels from IoT sensors</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {feedData?.map((item) => (
            <div key={item.id} className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium">{item.farmer_name}</p>
                <p className="text-xs text-muted-foreground">{item.address}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-medium">{item.current_quantity} kg</p>
                  <p className="text-xs text-muted-foreground">of {item.capacity} kg</p>
                </div>
                <div className="w-32">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getStatusColor(item.percentage_remaining)}`}
                      style={{ width: `${item.percentage_remaining}%` }}
                    />
                  </div>
                  <p className="text-xs text-center mt-1">{item.percentage_remaining.toFixed(1)}%</p>
                </div>
                {item.is_low_stock && (
                  <Badge variant="destructive" className="ml-2">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Low
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Inventory Status Component
interface InventoryStatusProps {
  inventoryData: InventoryItem[];
}

function InventoryStatus({ inventoryData }: InventoryStatusProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventory Status</CardTitle>
        <CardDescription>Current stock levels</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {inventoryData?.map((item) => (
            <div key={item.id} className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium">{item.product_name}</p>
                <p className="text-xs text-muted-foreground">
                  Min. stock: {item.minimum_stock} kg
                </p>
              </div>
              <div className="flex items-center gap-4">
                <p className="text-sm font-medium">{item.current_stock} kg</p>
                {item.is_low_stock && (
                  <Badge variant="destructive">Low Stock</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { isLoading: authLoading } = useAuth(); // Protect this page
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [feedStorageData, setFeedStorageData] = useState<FeedItem[]>([]);
  
  const updateFeedStorage = useDashboardStore((state) => state.updateFeedStorage);

  useEffect(() => {
    fetchDashboardData();
    
    // Setup WebSocket connection for real-time updates
    const socket = io('http://localhost:8001', {
      transports: ['websocket'],
    });

    socket.on('feed-update', (data) => {
      updateFeedStorage(data);
      if (data.is_low_stock) {
        toast.error(`Low feed alert for ${data.farmer_name}`);
      }
    });

    socket.on('connect_error', () => {
      console.log('WebSocket connection error - running without real-time updates');
    });

    return () => {
      socket.disconnect();
    };
  }, [updateFeedStorage]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch dashboard summary from manager API
      const dashboardSummary = await managerAPI.getDashboard();
      setDashboardData(dashboardSummary);

      // Fetch additional data
      const [orders, feedStorage] = await Promise.all([
        clientAPI.getOrders(),
        clientAPI.getFeedStorage(),
      ]);

      // Process recent orders with farmer names
      const recentOrdersWithNames = orders.slice(0, 10).map((order: {
        id: string;
        order_number: string;
        quantity: number;
        status: string;
        order_date: string;
        expected_delivery_date?: string;
        farmer_name?: string;
      }) => ({
        ...order,
        farmer_name: order.farmer_name || 'Unknown',
      }));
      setRecentOrders(recentOrdersWithNames);
      
      // Process feed storage data
      const feedDataProcessed = feedStorage.map((feed: {
        id: string;
        current_quantity: number;
        capacity: number;
        percentage_remaining: string | number;
        is_low_stock: boolean;
        farmer_name?: string;
        farmer_address?: string;
      }) => ({
        ...feed,
        farmer_name: feed.farmer_name || 'Unknown',
        address: feed.farmer_address || '',
        percentage_remaining: parseFloat(String(feed.percentage_remaining || 0)),
      }));
      setFeedStorageData(feedDataProcessed);
      
    } catch (error) {
      toast.error('Failed to load dashboard data');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
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

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Welcome to Soya Excel Management System
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Farmers"
            value={dashboardData?.total_farmers || 0}
            description="Active farmer clients"
            icon={Users}
          />
          <StatsCard
            title="Available Drivers"
            value={dashboardData?.available_drivers || 0}
            description="Ready for delivery"
            icon={Truck}
          />
          <StatsCard
            title="Pending Orders"
            value={dashboardData?.pending_orders || 0}
            description="Awaiting processing"
            icon={Package}
            trend={dashboardData?.orders_trend}
          />
          <StatsCard
            title="Low Stock Alerts"
            value={dashboardData?.low_stock_alerts || 0}
            description="Farmers need refill"
            icon={AlertTriangle}
          />
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="feed-monitor" className="space-y-4">
          <TabsList>
            <TabsTrigger value="feed-monitor">Feed Monitor</TabsTrigger>
            <TabsTrigger value="inventory">Inventory Status</TabsTrigger>
            <TabsTrigger value="recent-orders">Recent Orders</TabsTrigger>
          </TabsList>

          <TabsContent value="feed-monitor">
            <FeedStorageMonitor feedData={feedStorageData} />
          </TabsContent>

          <TabsContent value="inventory">
            <InventoryStatus inventoryData={dashboardData?.inventory_status || []} />
          </TabsContent>

          <TabsContent value="recent-orders">
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Latest orders from farmers</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order #</TableHead>
                      <TableHead>Farmer</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.order_number}</TableCell>
                        <TableCell>{order.farmer_name}</TableCell>
                        <TableCell>{order.quantity} kg</TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell>{format(new Date(order.order_date), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">View</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
} 
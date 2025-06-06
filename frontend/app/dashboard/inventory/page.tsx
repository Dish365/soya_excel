'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { Loading } from '@/components/ui/loading';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { managerAPI } from '@/lib/api';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Search, 
  Package, 
  AlertTriangle,
  DollarSign,
  BarChart3
} from 'lucide-react';
import { format } from 'date-fns';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

interface InventoryItem {
  id: string;
  product_name: string;
  product_code: string;
  current_stock: number;
  minimum_stock: number;
  maximum_stock: number;
  unit_price: number;
  last_restocked?: string;
  is_low_stock: boolean;
  stock_percentage: number;
}



const restockSchema = z.object({
  quantity: z.string().min(1, 'Quantity is required'),
  reference_number: z.string().min(1, 'Reference number is required'),
  description: z.string().optional(),
});

type RestockFormData = z.infer<typeof restockSchema>;

export default function InventoryPage() {
  const { isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isRestockOpen, setIsRestockOpen] = useState(false);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  const form = useForm<RestockFormData>({
    resolver: zodResolver(restockSchema),
    defaultValues: {
      quantity: '',
      reference_number: '',
      description: '',
    },
  });

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      const data = await managerAPI.getSupplyInventory();
      setInventory(data);
    } catch (error) {
      toast.error('Failed to load inventory data');
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch = 
      item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product_code.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStockFilter = !showLowStockOnly || item.is_low_stock;
    
    return matchesSearch && matchesStockFilter;
  });

  const getStockStatusBadge = (item: InventoryItem) => {
    if (item.current_stock <= item.minimum_stock) {
      return (
        <Badge variant="destructive">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Low Stock
        </Badge>
      );
    } else if (item.current_stock >= item.maximum_stock * 0.8) {
      return <Badge variant="default">Well Stocked</Badge>;
    } else {
      return <Badge variant="secondary">Normal</Badge>;
    }
  };

  const getStockColor = (percentage: number) => {
    if (percentage > 60) return 'bg-green-500';
    if (percentage > 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const openRestockDialog = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsRestockOpen(true);
    form.reset();
  };

  const onRestockSubmit = async (data: RestockFormData) => {
    if (!selectedItem) return;

    try {
      // In a real app, this would call an API endpoint with the form data
      console.log('Restock data:', data);
      toast.success(`Restock order placed for ${selectedItem.product_name}`);
      setIsRestockOpen(false);
      form.reset();
      // Refresh inventory data
      fetchInventoryData();
    } catch {
      toast.error('Failed to place restock order');
    }
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <Loading message="Loading inventory..." />
      </DashboardLayout>
    );
  }

  const totalValue = inventory.reduce((acc, item) => acc + (item.current_stock * item.unit_price), 0);
  const lowStockItems = inventory.filter(item => item.is_low_stock);
  const averageStockLevel = inventory.length > 0
    ? inventory.reduce((acc, item) => acc + item.stock_percentage, 0) / inventory.length
    : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Inventory Management</h2>
            <p className="text-muted-foreground">
              Monitor and manage feed supply inventory
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by product name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="low-stock" className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                id="low-stock"
                checked={showLowStockOnly}
                onChange={(e) => setShowLowStockOnly(e.target.checked)}
                className="rounded border-gray-300"
                aria-label="Show low stock items only"
              />
              <span className="text-sm font-medium">Low stock only</span>
            </label>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inventory.length}</div>
              <p className="text-xs text-muted-foreground">In inventory</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{lowStockItems.length}</div>
              <p className="text-xs text-muted-foreground">Need restocking</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">Current stock value</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Stock Level</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(averageStockLevel)}%</div>
              <p className="text-xs text-muted-foreground">Across all products</p>
            </CardContent>
          </Card>
        </div>

        {/* Inventory Table */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory Items</CardTitle>
            <CardDescription>
              Current stock levels and product information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Code</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>Stock Level</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Restocked</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.product_code}</TableCell>
                    <TableCell>{item.product_name}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">{item.current_stock} kg</p>
                        <p className="text-xs text-muted-foreground">
                          Min: {item.minimum_stock} / Max: {item.maximum_stock}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${getStockColor(item.stock_percentage)}`}
                            style={{ width: `${item.stock_percentage}%` }}
                          />
                        </div>
                        <p className="text-xs text-center">{Math.round(item.stock_percentage)}%</p>
                      </div>
                    </TableCell>
                    <TableCell>${item.unit_price.toFixed(2)}</TableCell>
                    <TableCell>{getStockStatusBadge(item)}</TableCell>
                    <TableCell>
                      {item.last_restocked 
                        ? format(new Date(item.last_restocked), 'MMM dd, yyyy')
                        : 'Never'
                      }
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openRestockDialog(item)}
                      >
                        Restock
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Restock Dialog */}
        <Dialog open={isRestockOpen} onOpenChange={setIsRestockOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Restock {selectedItem?.product_name}</DialogTitle>
              <DialogDescription>
                Place a restock order for this product
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onRestockSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">Current Stock:</span> {selectedItem?.current_stock} kg
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Minimum Stock:</span> {selectedItem?.minimum_stock} kg
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Maximum Stock:</span> {selectedItem?.maximum_stock} kg
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity to Restock (kg)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter quantity"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reference_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reference Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="PO number or reference"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Additional notes"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="submit">Place Restock Order</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
} 
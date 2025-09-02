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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  Package, 
  AlertTriangle,
  DollarSign,
  Wheat,
  Factory,
  Calendar
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

interface SoybeanMealInventoryItem {
  id: string;
  product_name: string;
  product_code: string;
  product_type: 'soybean_meal_44' | 'soybean_meal_48' | 'soybean_hulls' | 'soybean_oil' | 'specialty_blend';
  protein_percentage: number;
  primary_origin: 'canada' | 'usa' | 'argentina' | 'brazil';
  current_stock: number; // in tonnes
  minimum_stock: number; // in tonnes
  maximum_stock: number; // in tonnes
  base_price_per_tonne: number;
  silo_number: string;
  storage_location: string;
  current_batch_number: string;
  batch_received_date: string;
  quality_grade: 'A' | 'B' | 'Premium';
  sustainability_certified: boolean;
  is_low_stock: boolean;
  stock_percentage: number;
  alix_inventory_id: string;
}

const restockSchema = z.object({
  quantity: z.string().min(1, 'Quantity is required'),
  batch_number: z.string().min(1, 'Batch number is required'),
  quality_grade: z.enum(['A', 'B', 'Premium']),
  origin: z.enum(['canada', 'usa', 'argentina', 'brazil']),
  price_per_tonne: z.string().min(1, 'Price per tonne is required'),
  description: z.string().optional(),
});

type RestockFormData = z.infer<typeof restockSchema>;

export default function SoybeanInventoryPage() {
  const { isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState<SoybeanMealInventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<SoybeanMealInventoryItem | null>(null);
  const [isRestockOpen, setIsRestockOpen] = useState(false);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [productTypeFilter, setProductTypeFilter] = useState<string>('all');

  const form = useForm<RestockFormData>({
    resolver: zodResolver(restockSchema),
    defaultValues: {
      quantity: '',
      batch_number: '',
      quality_grade: 'A',
      origin: 'canada',
      price_per_tonne: '',
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
      toast.error('Failed to load soybean meal inventory');
      console.error('Error fetching soybean inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch = 
      item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.silo_number.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStockFilter = !showLowStockOnly || item.is_low_stock;
    const matchesTypeFilter = productTypeFilter === 'all' || item.product_type === productTypeFilter;
    
    return matchesSearch && matchesStockFilter && matchesTypeFilter;
  });

  const getProductTypeBadge = (productType: string | undefined | null) => {
    if (!productType) return <Badge variant="outline">Unknown</Badge>;
    
    const variants = {
      'soybean_meal_44': { variant: 'default' as const, label: 'SBM 44%' },
      'soybean_meal_48': { variant: 'secondary' as const, label: 'SBM 48%' },
      'soybean_hulls': { variant: 'outline' as const, label: 'Hulls' },
      'soybean_oil': { variant: 'destructive' as const, label: 'Oil' },
      'specialty_blend': { variant: 'default' as const, label: 'Blend' },
    };
    const config = variants[productType as keyof typeof variants] || { variant: 'outline' as const, label: productType };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStockStatusBadge = (item: SoybeanMealInventoryItem) => {
    const currentStock = item.current_stock || 0;
    const minimumStock = item.minimum_stock || 0;
    const maximumStock = item.maximum_stock || 0;
    
    if (currentStock <= minimumStock) {
      return (
        <Badge variant="destructive">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Low Stock
        </Badge>
      );
    } else if (currentStock >= maximumStock * 0.8) {
      return <Badge variant="default">Well Stocked</Badge>;
    } else {
      return <Badge variant="secondary">Normal</Badge>;
    }
  };

  const getOriginFlag = (origin: string | undefined | null) => {
    if (!origin) return '🌍 Unknown';
    
    const flags = {
      'canada': '🇨🇦 CA',
      'usa': '🇺🇸 US',
      'argentina': '🇦🇷 AR',
      'brazil': '🇧🇷 BR',
    };
    return flags[origin.toLowerCase() as keyof typeof flags] || `${origin.toUpperCase()}`;
  };

  const getStockColor = (percentage: number) => {
    if (percentage > 60) return 'bg-green-500';
    if (percentage > 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const openRestockDialog = (item: SoybeanMealInventoryItem) => {
    setSelectedItem(item);
    setIsRestockOpen(true);
    form.reset({
      quantity: '',
      batch_number: `BATCH${Date.now()}`,
      quality_grade: item.quality_grade || 'A',
      origin: item.primary_origin || 'canada',
      price_per_tonne: (item.base_price_per_tonne || 0).toString(),
      description: '',
    });
  };

  const onRestockSubmit = async (data: RestockFormData) => {
    if (!selectedItem) return;

    try {
      // In a real app, this would call the ALIX integration API
      console.log('Soybean meal restock data:', data);
      toast.success(`Restock order placed for ${selectedItem.product_name} (${data.quantity} tm)`);
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
        <Loading message="Loading soybean meal inventory..." />
      </DashboardLayout>
    );
  }

  const totalValue = inventory.reduce((acc, item) => acc + ((item.current_stock || 0) * (item.base_price_per_tonne || 0)), 0);
  const lowStockItems = inventory.filter(item => item.is_low_stock);
  const totalTonnes = inventory.reduce((acc, item) => acc + (item.current_stock || 0), 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Wheat className="h-8 w-8" />
              Soybean Meal Inventory
            </h2>
            <p className="text-muted-foreground">
              Monitor and manage soybean meal products across silos
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Factory className="h-4 w-4" />
            <span>ALIX Integration Active</span>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products or silo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={productTypeFilter} onValueChange={setProductTypeFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by product type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Products</SelectItem>
              <SelectItem value="soybean_meal_44">SBM 44%</SelectItem>
              <SelectItem value="soybean_meal_48">SBM 48%</SelectItem>
              <SelectItem value="soybean_hulls">Soybean Hulls</SelectItem>
              <SelectItem value="soybean_oil">Soybean Oil</SelectItem>
              <SelectItem value="specialty_blend">Specialty Blends</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <label htmlFor="low-stock" className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                id="low-stock"
                checked={showLowStockOnly}
                onChange={(e) => setShowLowStockOnly(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm font-medium">Low stock only</span>
            </label>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Product Lines</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inventory.length}</div>
              <p className="text-xs text-muted-foreground">Soybean products</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Stock</CardTitle>
              <Wheat className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTonnes.toFixed(1)} tm</div>
              <p className="text-xs text-muted-foreground">Across all silos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{lowStockItems.length}</div>
              <p className="text-xs text-muted-foreground">Need restocking</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(totalValue / 1000).toFixed(0)}K
              </div>
              <p className="text-xs text-muted-foreground">Current stock value</p>
            </CardContent>
          </Card>
        </div>

        {/* Inventory Table */}
        <Card>
          <CardHeader>
            <CardTitle>Soybean Meal Inventory</CardTitle>
            <CardDescription>
              Current stock levels across all silo locations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Silo</TableHead>
                  <TableHead>Protein %</TableHead>
                  <TableHead>Origin</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>Stock Level</TableHead>
                  <TableHead>Quality</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Batch</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">{item.product_name}</p>
                        <div className="flex items-center gap-1">
                          {getProductTypeBadge(item.product_type)}
                          {item.sustainability_certified && (
                            <Badge variant="outline" className="text-xs">
                              Certified
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">{item.silo_number}</p>
                        <p className="text-xs text-muted-foreground">{item.storage_location}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{item.protein_percentage}%</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {getOriginFlag(item.primary_origin)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">{(item.current_stock || 0).toFixed(1)} tm</p>
                        <p className="text-xs text-muted-foreground">
                          Min: {item.minimum_stock || 0} / Max: {item.maximum_stock || 0} tm
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${getStockColor(item.stock_percentage || 0)}`}
                            style={{ width: `${Math.min(100, item.stock_percentage || 0)}%` }}
                          />
                        </div>
                        <p className="text-xs text-center">{Math.round(item.stock_percentage || 0)}%</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">Grade {item.quality_grade || 'Unknown'}</Badge>
                    </TableCell>
                    <TableCell>{getStockStatusBadge(item)}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-xs font-medium">{item.current_batch_number || 'N/A'}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {item.batch_received_date ? format(new Date(item.batch_received_date), 'MMM dd') : 'N/A'}
                        </p>
                      </div>
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
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Restock {selectedItem?.product_name}</DialogTitle>
              <DialogDescription>
                Place a restock order via ALIX manufacturing system
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onRestockSubmit)} className="space-y-4">
                <div className="bg-gray-50 p-3 rounded space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">Silo:</span> {selectedItem?.silo_number || 'N/A'}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Current Stock:</span> {(selectedItem?.current_stock || 0).toFixed(1)} tm
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Target Range:</span> {selectedItem?.minimum_stock || 0} - {selectedItem?.maximum_stock || 0} tm
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity to Order (tonnes)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="Enter quantity in tonnes"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="quality_grade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quality Grade</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Premium">Premium</SelectItem>
                            <SelectItem value="A">Grade A</SelectItem>
                            <SelectItem value="B">Grade B</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="origin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Origin</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="canada">🇨🇦 Canada</SelectItem>
                            <SelectItem value="usa">🇺🇸 USA</SelectItem>
                            <SelectItem value="argentina">🇦🇷 Argentina</SelectItem>
                            <SelectItem value="brazil">🇧🇷 Brazil</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="batch_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Batch Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Batch identifier"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price_per_tonne"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price per Tonne ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Price per tonne"
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
                  <Button type="submit" className="w-full">
                    Submit to ALIX System
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
} 
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/lib/store';
import { useAuth } from '@/lib/hooks/useAuth';
import Image from 'next/image';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { isLoading: authLoading } = useAuth(false); // Don't require auth, redirect if authenticated
  const [isLoading, setIsLoading] = useState(false);
  const login = useAuthStore((state) => state.login);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await login(data.username, data.password);
      toast.success('Login successful!');
      router.push('/dashboard');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid credentials';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center soya-gradient">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-white text-lg font-medium">Loading Soya Excel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center soya-gradient relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-yellow-400/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-green-600/10 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative z-10 w-full max-w-md">
        {/* Logo and Branding */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="bg-white rounded-2xl p-4 shadow-2xl">
              <Image
                src="/LOGO-SoyaExcel.png"
                alt="Soya Excel Logo"
                width={120}
                height={120}
                className="w-24 h-24 object-contain"
              />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Soya Excel</h1>
          <p className="text-yellow-200 text-lg font-medium">Feed Distribution Management System</p>
          <div className="flex justify-center items-center gap-2 mt-3">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
            <div className="w-3 h-3 bg-black rounded-full"></div>
          </div>
        </div>
        
        {/* Login Card */}
        <Card className="soya-card border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold text-gray-800">Manager Login</CardTitle>
            <CardDescription className="text-gray-600">
              Enter your credentials to access the management dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-gray-700 font-medium">Username</Label>
                <div className="relative">
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    className="border-2 border-gray-200 focus:border-green-500 focus:ring-green-500/20 rounded-lg py-3 px-4 transition-all duration-200"
                    {...register('username')}
                    disabled={isLoading}
                  />
                </div>
                {errors.username && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                    {errors.username.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    className="border-2 border-gray-200 focus:border-green-500 focus:ring-green-500/20 rounded-lg py-3 px-4 transition-all duration-200"
                    {...register('password')}
                    disabled={isLoading}
                  />
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                    {errors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full soya-button-primary py-3 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Logging in...
                  </div>
                ) : (
                  'Login to Dashboard'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-white/70 text-sm">
            © 2024 Soya Excel. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
} 
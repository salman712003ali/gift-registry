import React, { useState, useEffect } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useToast } from './ui/use-toast';

// Create a simplified toast implementation if the component is missing
const useToast = () => {
  return {
    toast: ({ title, description, variant }: {
      title: string;
      description: string;
      variant?: 'default' | 'destructive';
    }) => {
      console.log(`${title}: ${description}`);
      alert(`${title}: ${description}`);
    }
  };
};

interface PaymentFormProps {
  registryId: string;
  giftItemId?: string;
  itemName?: string;
  amount: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function PaymentForm({
  registryId,
  giftItemId,
  itemName,
  amount,
  onSuccess,
  onCancel
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<{ first_name: string; last_name: string } | null>(null);
  const { toast } = useToast();
  const supabase = createClientComponentClient();

  useEffect(() => {
    // Get current user if logged in
    const fetchUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUserId(session.user.id);
          
          // Get user profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', session.user.id)
            .single();
            
          if (profile) {
            setUserProfile(profile);
          }
        }
      } catch (error) {
        console.error('Error fetching user session:', error);
      }
    };
    
    fetchUser();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      toast({
        title: "Payment Error",
        description: "Stripe has not initialized yet. Please try again.",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Create payment intent
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          registryId,
          giftItemId,
          message,
          isAnonymous,
          userId: isAnonymous ? null : userId
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to create payment intent');
      }
      
      const { clientSecret } = await response.json();
      
      // Confirm payment
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        },
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (paymentIntent.status === 'succeeded') {
        toast({
          title: "Payment Successful",
          description: `Thank you for your contribution of ₹${(amount / 100).toFixed(2)}.`,
        });
        
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "An error occurred during payment processing.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Contribute</CardTitle>
        <CardDescription>
          {giftItemId 
            ? `Contributing ₹${(amount / 100).toFixed(2)} to "${itemName}"` 
            : `Contributing ₹${(amount / 100).toFixed(2)} to this registry`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {userProfile && (
            <div className="text-sm text-muted-foreground">
              Contributing as: {userProfile.first_name} {userProfile.last_name}
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            <input 
              type="checkbox"
              id="isAnonymous" 
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              disabled={isLoading}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <Label htmlFor="isAnonymous">Make contribution anonymous</Label>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="message">Message (optional)</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a message with your contribution"
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="card-element">Card Details</Label>
            <div className="p-3 border rounded-md bg-white">
              <CardElement 
                id="card-element"
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#424770',
                      '::placeholder': {
                        color: '#aab7c4',
                      },
                    },
                    invalid: {
                      color: '#9e2146',
                    },
                  },
                }}
              />
            </div>
          </div>
          
          <div className="flex gap-4 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !stripe}
              className="flex-1"
            >
              {isLoading ? 'Processing...' : `Pay ₹${(amount / 100).toFixed(2)}`}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 
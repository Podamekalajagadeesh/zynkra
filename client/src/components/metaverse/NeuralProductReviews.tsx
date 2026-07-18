import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Brain, Star, Plus, MessageSquare, Users } from 'lucide-react';
import api from '../../lib/api';

interface NeuralProductReview {
  id: string;
  productId: string;
  userId: string;
  user: any;
  sensoryData: Array<{ type: string; data: any }>;
  overallRating: number;
  categoryRatings: Record<string, number>;
  isVerifiedPurchase: boolean;
  createdAt: Date;
}

export const NeuralProductReviews: React.FC = () => {
  const [reviews, setReviews] = useState<NeuralProductReview[]>([]);
  const [userReviews, setUserReviews] = useState<NeuralProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [newReview, setNewReview] = useState<Partial<NeuralProductReview>>({
    overallRating: 5,
    isVerifiedPurchase: false,
  });

  const fetchReviews = async () => {
    try {
      const [publicReviews, myReviews] = await Promise.all([
        api.get('/neural-product-reviews/product/sample-product'),
        api.get('/neural-product-reviews/user/my'),
      ]);
      setReviews(publicReviews.data);
      setUserReviews(myReviews.data);
    } catch (error) {
      console.error('Failed to fetch reviews', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleCreateReview = async () => {
    try {
      await api.post('/neural-product-reviews', newReview);
      fetchReviews();
      setNewReview({ overallRating: 5, isVerifiedPurchase: false });
    } catch (error) {
      console.error('Failed to create review', error);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-purple-500" />
            Neural Product Reviews
          </h2>
          <p className="text-gray-500 mt-2">
            Share full sensory experiences of products directly with other users
          </p>
        </div>
      </div>

      <Tabs defaultValue="browse">
        <TabsList className="mb-6">
          <TabsTrigger value="browse">Browse Reviews</TabsTrigger>
          <TabsTrigger value="my-reviews">My Reviews</TabsTrigger>
          <TabsTrigger value="write-review">Write Review</TabsTrigger>
        </TabsList>

        <TabsContent value="browse">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-500">Loading reviews...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reviews.length > 0 ? (
                reviews.map((review) => (
                  <Card key={review.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg font-semibold">
                          {review.user?.username || 'User'}
                        </CardTitle>
                        {review.isVerifiedPurchase && (
                          <Badge className="bg-green-100 text-green-800 border-none">
                            Verified Purchase
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= review.overallRating
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                        <span className="ml-2 text-sm text-gray-600">
                          {review.overallRating.toFixed(1)}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {review.sensoryData.map((sensory, idx) => (
                          <Badge key={idx} variant="outline">
                            {sensory.type}
                          </Badge>
                        ))}
                      </div>

                      <div className="text-sm text-gray-500">
                        Reviewed on {new Date(review.createdAt).toLocaleDateString()}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-500">No reviews yet</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="my-reviews">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userReviews.map((review) => (
              <Card key={review.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">
                    Product ID: {review.productId}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= review.overallRating
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
            {userReviews.length === 0 && (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500">You haven't written any reviews yet</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="write-review">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-xl">Write Neural Review</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product ID
                </label>
                <Input
                  value={newReview.productId || ''}
                  onChange={(e) =>
                    setNewReview({ ...newReview, productId: e.target.value })
                  }
                  placeholder="Enter product ID"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Overall Rating
                </label>
                <Input
                  type="number"
                  min="1"
                  max="5"
                  step="0.5"
                  value={newReview.overallRating || 5}
                  onChange={(e) =>
                    setNewReview({
                      ...newReview,
                      overallRating: parseFloat(e.target.value) || 5,
                    })
                  }
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="verified-purchase"
                  checked={newReview.isVerifiedPurchase}
                  onChange={(e) =>
                    setNewReview({
                      ...newReview,
                      isVerifiedPurchase: e.target.checked,
                    })
                  }
                  className="h-4 w-4"
                />
                <label
                  htmlFor="verified-purchase"
                  className="text-sm font-medium text-gray-700"
                >
                  Verified Purchase
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sensory Data (JSON)
                </label>
                <Textarea
                  value={JSON.stringify(newReview.sensoryData || [], null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      setNewReview({ ...newReview, sensoryData: parsed });
                    } catch {
                      // ignore invalid JSON while typing
                    }
                  }}
                  placeholder='[{"type": "visual", "data": {}}]'
                  rows={6}
                />
              </div>

              <Button onClick={handleCreateReview} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Submit Review
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

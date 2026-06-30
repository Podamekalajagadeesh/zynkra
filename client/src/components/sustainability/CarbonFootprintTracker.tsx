import React, { useState } from 'react';
import { Leaf, TreeDeciduous, TrendingUp, Info, ChevronDown, ChevronUp, Recycle, Globe, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { calculateCarbonFootprint, formatCarbonEmissions, getPlatformSustainabilityMetrics, CarbonFootprint as CarbonFootprintType } from '../../lib/carbonCalculator';

interface CarbonFootprintTrackerProps {
  contentMetadata: {
    type: 'video' | 'image' | 'audio' | 'text';
    sizeInBytes: number;
    durationInSeconds?: number;
    resolution?: string;
    textLengthInKB?: number;
  };
  className?: string;
}

export const CarbonFootprintTracker: React.FC<CarbonFootprintTrackerProps> = ({ contentMetadata, className = '' }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  
  const footprint: CarbonFootprintType = calculateCarbonFootprint(contentMetadata);
  const platformMetrics = getPlatformSustainabilityMetrics();
  
  // Get sustainability color based on score
  const getSustainabilityColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };
  
  // Get sustainability badge variant
  const getSustainabilityBadge = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (score >= 50) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  };

  return (
    <div className={`border rounded-lg overflow-hidden ${className}`}>
      <div className="bg-green-50 dark:bg-green-950 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Leaf className="h-5 w-5 text-green-600 dark:text-green-400" />
            <h3 className="font-semibold text-green-800 dark:text-green-200">Carbon Footprint Tracker</h3>
            <Badge className={getSustainabilityBadge(footprint.sustainabilityScore)}>
              {footprint.sustainabilityScore >= 80 ? 'Eco-Friendly' : footprint.sustainabilityScore >= 50 ? 'Moderate' : 'Needs Improvement'}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 px-2">
                  <Info className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Platform Sustainability Efforts</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Renewable Energy Usage</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <Globe className="h-5 w-5 text-green-600" />
                        <span className="text-2xl font-bold">{platformMetrics.renewableEnergyPercentage}%</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Working towards 100% by 2035</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Emissions Offset to Date</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <Recycle className="h-5 w-5 text-blue-600" />
                        <span className="text-2xl font-bold">{(platformMetrics.totalEmissionsOffsetToDate / 1000).toFixed(0)}k</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">tonnes of CO2e offset</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Trees Planted</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <TreeDeciduous className="h-5 w-5 text-green-700" />
                        <span className="text-2xl font-bold">{(platformMetrics.treesPlanted / 1000).toFixed(0)}k</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">through reforestation programs</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">User Emissions Saved</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-emerald-600" />
                        <span className="text-2xl font-bold">{(platformMetrics.usersCarbonSaved / 1000).toFixed(0)}k</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">tonnes saved by sustainable choices</p>
                    </CardContent>
                  </Card>
                </div>
                <div className="mt-4 p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <h4 className="font-semibold mb-2">Our Commitment</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    We're committed to becoming carbon negative by 2030. Currently, {platformMetrics.currentOffsetRate}% of our platform's emissions are offset through renewable energy projects and carbon removal initiatives. 
                    We're working towards our target of {platformMetrics.targetOffsetRate}% offset by 2030.
                  </p>
                </div>
              </DialogContent>
            </Dialog>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-2"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        
        <div className="mt-3 grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-green-700 dark:text-green-300">Estimated Emissions</p>
            <p className={`text-xl font-bold ${getSustainabilityColor(footprint.sustainabilityScore)}`}>
              {formatCarbonEmissions(footprint.netEmissions)}
            </p>
          </div>
          <div>
            <p className="text-sm text-green-700 dark:text-green-300">Sustainability Score</p>
            <p className={`text-xl font-bold ${getSustainabilityColor(footprint.sustainabilityScore)}`}>
              {footprint.sustainabilityScore}/100
            </p>
          </div>
        </div>
      </div>
      
      {isExpanded && (
        <div className="p-4 bg-white dark:bg-gray-900">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-2">Emissions Breakdown</h4>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                  <p className="text-gray-500 dark:text-gray-400">Processing</p>
                  <p className="font-medium">{formatCarbonEmissions(footprint.processingEmissions)}</p>
                </div>
                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                  <p className="text-gray-500 dark:text-gray-400">Transfer</p>
                  <p className="font-medium">{formatCarbonEmissions(footprint.transferEmissions)}</p>
                </div>
                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                  <p className="text-gray-500 dark:text-gray-400">Storage (annual)</p>
                  <p className="font-medium">{formatCarbonEmissions(footprint.storageEmissions)}</p>
                </div>
              </div>
            </div>
            
            <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
              <p className="text-sm text-green-800 dark:text-green-200 font-medium mb-1">Platform Offset: {formatCarbonEmissions(footprint.platformOffset)}</p>
              <p className="text-xs text-green-700 dark:text-green-300">
                {platformMetrics.currentOffsetRate}% of this content's emissions are offset by our renewable energy projects.
              </p>
            </div>
            
            {footprint.recommendations.length > 0 && (
              <div>
                <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  Tips to reduce your footprint
                </h4>
                <ul className="space-y-1">
                  {footprint.recommendations.map((rec, index) => (
                    <li key={index} className="text-xs text-gray-600 dark:text-gray-400 pl-4 relative">
                      <span className="absolute left-1 top-1.5 w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
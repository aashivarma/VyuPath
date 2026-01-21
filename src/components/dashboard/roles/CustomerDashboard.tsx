
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSamples, usePricingTiers } from "../../../hooks/useApiData";
import { useAuth } from "../../../hooks/useAuth";
import StatsCards from "../StatsCards";
import { Upload, Download, FileText, CreditCard, Loader2 } from "lucide-react";

interface CustomerDashboardProps {
  currentView: string;
}

const CustomerDashboard = ({ currentView }: CustomerDashboardProps) => {
  const { samples, loading: samplesLoading, error: samplesError } = useSamples();
  const { pricingTiers, loading: pricingLoading } = usePricingTiers();
  const { user } = useAuth();

  // For demonstration, we'll show all samples. In a real app, you'd filter by customer
  const customerSamples = samples;

  if (samplesLoading || pricingLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2">Loading data...</span>
      </div>
    );
  }

  if (samplesError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Error loading data: {samplesError}</p>
      </div>
    );
  }

  if (currentView === "submit") {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Submit Sample Request</h2>
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="h-5 w-5" />
              <span>Sample Pickup Request</span>
            </CardTitle>
            <CardDescription>Request sample collection from your facility</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="patientName">Patient Name</Label>
                <Input id="patientName" placeholder="Enter patient name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="patientAge">Patient Age</Label>
                <Input id="patientAge" type="number" placeholder="Age" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="testType">Test Type</Label>
                <select className="w-full p-2 border border-gray-300 rounded-md">
                  <option value="">Select test type</option>
                  <option value="LBC">LBC (Liquid-based Cytology)</option>
                  <option value="HPV">HPV (DNA Testing)</option>
                  <option value="Co-test">Co-test (LBC + HPV)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="urgency">Urgency</Label>
                <select className="w-full p-2 border border-gray-300 rounded-md">
                  <option value="normal">Normal</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pickupAddress">Pickup Address</Label>
              <Textarea id="pickupAddress" placeholder="Enter complete pickup address" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialInstructions">Special Instructions</Label>
              <Textarea id="specialInstructions" placeholder="Any special handling instructions" />
            </div>
            <Button className="w-full bg-blue-600 hover:bg-blue-700">
              <Upload className="h-4 w-4 mr-2" />
              Submit Pickup Request
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentView === "track") {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Track Samples ({customerSamples.length})</h2>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Barcode</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {customerSamples.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                        No samples found
                      </td>
                    </tr>
                  ) : (
                    customerSamples.map((sample) => (
                      <tr key={sample.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{sample.barcode}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sample.test_type}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={
                            sample.status === 'completed' ? 'default' : 
                            sample.status === 'processing' ? 'secondary' : 
                            'outline'
                          }>
                            {sample.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(sample.accession_date || '').toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {sample.status === 'completed' ? (
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                          ) : (
                            <Button variant="outline" size="sm" disabled>
                              Processing
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentView === "billing") {
    const goldTier = pricingTiers.find(tier => tier.tier_name === 'Gold');
    
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Billing Summary</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Current Tier</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="default" className="text-lg px-4 py-2">Gold Tier</Badge>
              {goldTier && (
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">LBC Test</span>
                    <span className="text-sm font-medium">₹{goldTier.lbc_price}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">HPV Test</span>
                    <span className="text-sm font-medium">₹{goldTier.hpv_price}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Co-test</span>
                    <span className="text-sm font-medium">₹{goldTier.co_test_price}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">₹{
                customerSamples.reduce((total, sample) => {
                  if (!goldTier) return total;
                  switch (sample.test_type) {
                    case 'LBC': return total + goldTier.lbc_price;
                    case 'HPV': return total + goldTier.hpv_price;
                    case 'Co-test': return total + goldTier.co_test_price;
                    default: return total;
                  }
                }, 0).toLocaleString()
              }</p>
              <p className="text-sm text-gray-600 mt-2">{customerSamples.length} samples processed</p>
              <div className="mt-4 space-y-1">
                <div className="flex justify-between text-sm">
                  <span>LBC: {customerSamples.filter(s => s.test_type === 'LBC').length} tests</span>
                  <span>₹{(customerSamples.filter(s => s.test_type === 'LBC').length * (goldTier?.lbc_price || 0)).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>HPV: {customerSamples.filter(s => s.test_type === 'HPV').length} tests</span>
                  <span>₹{(customerSamples.filter(s => s.test_type === 'HPV').length * (goldTier?.hpv_price || 0)).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Co-test: {customerSamples.filter(s => s.test_type === 'Co-test').length} tests</span>
                  <span>₹{(customerSamples.filter(s => s.test_type === 'Co-test').length * (goldTier?.co_test_price || 0)).toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Outstanding</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-orange-600">₹45,200</p>
              <p className="text-sm text-gray-600 mt-2">Pending payment</p>
              <Button className="w-full mt-4" variant="outline">
                <CreditCard className="h-4 w-4 mr-2" />
                Make Payment
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const completedSamples = customerSamples.filter(sample => sample.status === 'completed');
  const processingSamples = customerSamples.filter(sample => sample.status === 'processing');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Customer Portal</h2>
        <div className="text-sm text-gray-600">
          Welcome {user?.name} - {user?.role}
        </div>
      </div>
      
      <StatsCards role="customer" />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>{completedSamples.length} reports available for download</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>{processingSamples.length} samples in processing</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span>{customerSamples.length} total samples submitted</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <Upload className="h-4 w-4 mr-2" />
              Submit New Sample Request
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Download className="h-4 w-4 mr-2" />
              Download Recent Reports
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <FileText className="h-4 w-4 mr-2" />
              View Monthly Summary
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CustomerDashboard;

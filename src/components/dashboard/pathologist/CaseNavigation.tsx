
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  ChevronDown, 
  ChevronUp, 
  Search, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Calendar
} from "lucide-react";

interface CaseData {
  id: string;
  barcode: string;
  patientName: string;
  age: number;
  testType: string;
  status: "pending" | "verified" | "approved";
  priority: "normal" | "urgent" | "stat";
  collectionDate: string;
  assignedDate?: string;
}

interface CaseNavigationProps {
  currentCaseId: string;
  cases: CaseData[];
  onCaseSelect: (caseId: string) => void;
}

const CaseNavigation = ({ currentCaseId, cases, onCaseSelect }: CaseNavigationProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "verified" | "approved">("all");

  console.log(cases)
  const filteredCases = cases.filter(case_ => {
    const matchesSearch = case_.barcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         case_.patientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || case_.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  

  const pendingCount = cases.filter(c => c.status === "pending").length;
  const verifiedCount = cases.filter(c => c.status === "verified").length;
  const approvedCount = cases.filter(c => c.status === "approved").length;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "verified": return <CheckCircle className="h-3 w-3 text-blue-600" />;
      case "approved": return <CheckCircle className="h-3 w-3 text-green-600" />;
      default: return <Clock className="h-3 w-3 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "stat": return "bg-red-500 text-white";
      case "urgent": return "bg-orange-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base">Case Navigation</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-3 w-3 mr-1" />
                Collapse
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3 mr-1" />
                Browse Cases
              </>
            )}
          </Button>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center p-2 bg-orange-50 rounded">
            <p className="font-bold text-orange-600">{pendingCount}</p>
            <p className="text-orange-700">Pending</p>
          </div>
          <div className="text-center p-2 bg-blue-50 rounded">
            <p className="font-bold text-blue-600">{verifiedCount}</p>
            <p className="text-blue-700">Verified</p>
          </div>
          <div className="text-center p-2 bg-green-50 rounded">
            <p className="font-bold text-green-600">{approvedCount}</p>
            <p className="text-green-700">Approved</p>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-3">
          {/* Search and Filter */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-3 w-3 text-gray-400" />
              <Input
                placeholder="Search by barcode or patient name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-7 text-xs h-8"
              />
            </div>
            
            <div className="flex space-x-1">
              {["all", "pending", "verified", "approved"].map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(status as any)}
                  className="text-xs px-2 py-1 h-7"
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {/* Case List */}
          <div className="max-h-64 overflow-y-auto space-y-1">
            {filteredCases.map((case_) => (
              <div
                key={case_.id}
                onClick={() => onCaseSelect(case_.id)}
                className={`p-2 rounded cursor-pointer transition-colors text-xs ${
                  case_.id === currentCaseId
                    ? "bg-blue-100 border border-blue-300"
                    : "bg-gray-50 hover:bg-gray-100"
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(case_.status)}
                    <span className="font-medium font-mono">{case_.barcode}</span>
                    {case_.priority !== "normal" && (
                      <Badge className={`text-xs px-1 py-0 ${getPriorityColor(case_.priority)}`}>
                        {case_.priority.toUpperCase()}
                      </Badge>
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs">{case_.testType}</Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="font-medium">{case_.patientName}</span>
                  <span className="text-gray-500">{case_.age}y</span>
                </div>
                
                <div className="flex items-center justify-between mt-1 text-gray-500">
                  <div className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    <span>{case_.collectionDate}</span>
                  </div>
                  {case_.assignedDate && (
                    <span>Assigned: {case_.assignedDate}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredCases.length === 0 && (
            <div className="text-center py-4 text-gray-500 text-xs">
              No cases found matching your criteria
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default CaseNavigation;

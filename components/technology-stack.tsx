import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function TechnologyStack() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Technology Stack</CardTitle>
        <CardDescription>
          Complete overview of technologies used in this Network Anomaly Detection system
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-2">Frontend</h3>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">Next.js 14</Badge>
            <Badge variant="outline">React 18</Badge>
            <Badge variant="outline">TypeScript</Badge>
            <Badge variant="outline">Tailwind CSS</Badge>
            <Badge variant="outline">shadcn/ui</Badge>
            <Badge variant="outline">Lucide Icons</Badge>
            <Badge variant="outline">jsPDF</Badge>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2">Backend</h3>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">Next.js API Routes</Badge>
            <Badge variant="outline">WebSockets</Badge>
            <Badge variant="outline">Node.js</Badge>
            <Badge variant="outline">Zod (Validation)</Badge>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2">Data Collection Tools</h3>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">pcap (Packet Capture)</Badge>
            <Badge variant="outline">SNMP</Badge>
            <Badge variant="outline">NetFlow/IPFIX</Badge>
            <Badge variant="outline">Syslog</Badge>
            <Badge variant="outline">Prometheus</Badge>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2">Data Processing</h3>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">Python</Badge>
            <Badge variant="outline">NumPy</Badge>
            <Badge variant="outline">Pandas</Badge>
            <Badge variant="outline">Apache Kafka</Badge>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2">Machine Learning / Anomaly Detection</h3>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">scikit-learn</Badge>
            <Badge variant="outline">Statistical Methods (Z-score)</Badge>
            <Badge variant="outline">Isolation Forest</Badge>
            <Badge variant="outline">DBSCAN</Badge>
            <Badge variant="outline">One-Class SVM</Badge>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2">Deployment & DevOps</h3>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">Docker</Badge>
            <Badge variant="outline">Kubernetes</Badge>
            <Badge variant="outline">Vercel</Badge>
            <Badge variant="outline">GitHub Actions</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

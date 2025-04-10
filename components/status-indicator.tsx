import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react"

export default function StatusIndicator({ status, isConnected }) {
  let icon
  let text
  let variant

  switch (status) {
    case "connected":
      icon = <CheckCircle className="h-4 w-4" />
      text = "Connected"
      variant = "success"
      break
    case "connecting":
      icon = <Loader2 className="h-4 w-4 animate-spin" />
      text = "Connecting"
      variant = "outline"
      break
    case "disconnected":
      icon = <AlertCircle className="h-4 w-4" />
      text = "Disconnected"
      variant = "destructive"
      break
    case "error":
      icon = <AlertCircle className="h-4 w-4" />
      text = "Connection Error"
      variant = "destructive"
      break
    default:
      icon = <Loader2 className="h-4 w-4 animate-spin" />
      text = "Initializing"
      variant = "outline"
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={variant} className="flex items-center gap-1 px-3 py-1">
            {icon}
            <span>{text}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {isConnected
              ? "Connected to the network data stream"
              : "Not connected to the network data stream. Click 'Reconnect' to try again."}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

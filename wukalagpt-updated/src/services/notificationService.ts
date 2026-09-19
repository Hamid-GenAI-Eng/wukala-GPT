import * as signalR from "@microsoft/signalr";
import { toast } from "@/hooks/use-toast";
import { triggerGlobalRefresh } from "@/utils/events";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5285/api/v1";
const HUB_BASE_URL = API_BASE_URL.replace(/\/api(\/v\d+)?$/, "");

class NotificationService {
  private connection: signalR.HubConnection | null = null;
  private isConnecting: boolean = false;

  public async startConnection(token: string) {
    if (this.connection?.state === signalR.HubConnectionState.Connected || this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    try {
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(`${HUB_BASE_URL}/notificationhub`, {
          accessTokenFactory: () => token,
          skipNegotiation: true,
          transport: signalR.HttpTransportType.WebSockets
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
        .configureLogging(signalR.LogLevel.Warning)
        .build();

      this.connection.on("ReceiveNotification", (notification: any) => {
        // Trigger a global UI refresh to update badges
        triggerGlobalRefresh();

        // Show toast
        toast({
          title: "New Notification",
          description: notification.message || notification.content || "You have a new update.",
        });
      });

      await this.connection.start();
      console.log("SignalR: Connected to NotificationHub");
    } catch (err) {
      console.error("SignalR Notification connection error:", err);
    } finally {
      this.isConnecting = false;
    }
  }

  public async stopConnection() {
    if (this.connection) {
      await this.connection.stop();
      this.connection = null;
    }
  }
}

export const notificationService = new NotificationService();

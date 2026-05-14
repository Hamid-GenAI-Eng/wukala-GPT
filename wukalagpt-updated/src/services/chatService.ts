import * as signalR from "@microsoft/signalr";

export type MessageReceivedCallback = (message: any) => void;
export type UserStatusCallback = (userId: string, isOnline: boolean) => void;

class ChatService {
  private connection: signalR.HubConnection | null = null;
  private messageCallbacks: MessageReceivedCallback[] = [];
  private statusCallbacks: UserStatusCallback[] = [];

  /**
   * Initialize and start the SignalR connection
   */
  public async startConnection(token: string) {
    if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
      return;
    }

    const hubUrl = `${import.meta.env.VITE_API_BASE_URL.replace('/api', '')}/chathub`;
    
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => token,
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();

    // Set up listeners
    this.connection.on("ReceiveMessage", (message) => {
      this.messageCallbacks.forEach(cb => cb(message));
    });

    this.connection.on("UserStatusChanged", (userId, isOnline) => {
      this.statusCallbacks.forEach(cb => cb(userId, isOnline));
    });

    try {
      await this.connection.start();
      console.log("SignalR: Connected to ChatHub");
    } catch (err) {
      console.error("SignalR: Connection failed", err);
      // Wait and retry if needed, managed by withAutomaticReconnect
    }
  }

  /**
   * Stop the SignalR connection
   */
  public async stopConnection() {
    if (this.connection) {
      await this.connection.stop();
      this.connection = null;
    }
  }

  /**
   * Send a message in real-time
   */
  public async sendMessage(receiverId: string, content: string) {
    if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
      await this.connection.invoke("SendMessage", receiverId, content);
    } else {
      throw new Error("SignalR: Not connected");
    }
  }

  /**
   * Subscribe to new messages
   */
  public onMessageReceived(callback: MessageReceivedCallback) {
    this.messageCallbacks.push(callback);
    return () => {
      this.messageCallbacks = this.messageCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Subscribe to user status changes
   */
  public onUserStatusChanged(callback: UserStatusCallback) {
    this.statusCallbacks.push(callback);
    return () => {
      this.statusCallbacks = this.statusCallbacks.filter(cb => cb !== callback);
    };
  }
}

export const chatService = new ChatService();

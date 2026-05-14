using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;

namespace WukalaGPT.API.Hubs;

[Authorize]
public class ChatHub : Hub
{
    public async Task SendMessageToUser(string receiverUserId, string messageContent, Guid messageId, DateTime timestamp)
    {
        // Broadcast the message to the specific user globally via the Redis Backplane
        await Clients.Group("User_" + receiverUserId).SendAsync("ReceiveMessage", new 
        {
            MessageId = messageId,
            SenderId = Context.UserIdentifier,
            Content = messageContent,
            SentAt = timestamp
        });
    }

    public override async Task OnConnectedAsync()
    {
        var userId = Context.UserIdentifier;
        if (!string.IsNullOrEmpty(userId))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, "User_" + userId);
        }
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.UserIdentifier;
        if (!string.IsNullOrEmpty(userId))
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, "User_" + userId);
        }
        await base.OnDisconnectedAsync(exception);
    }
}

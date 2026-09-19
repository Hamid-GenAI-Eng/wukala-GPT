using System;
using CloudinaryDotNet;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;

class Program
{
    static async Task Main(string[] args)
    {
        var account = new Account(
            "dwf7pmleh",
            "135835529511658",
            "BB_oz3tzzMyUXZDff8ISW63YkkY"
        );
        var _cloudinary = new Cloudinary(account);

        string fileUrl = "https://res.cloudinary.com/dwf7pmleh/raw/upload/v1788590169/wukala_documents/oeyvzpapj59f5il07jcm.pdf";
        
        var uri = new Uri(fileUrl);
        var segments = uri.Segments;
        
        var resourceTypeStr = "raw";
        var publicIdWithExtension = segments.Last();
        var folderSegments = segments.Skip(5).Take(segments.Length - 6);
        var publicId = Uri.UnescapeDataString(publicIdWithExtension);
        var fullPublicId = string.Join("", folderSegments) + publicId;

        var builder = _cloudinary.Api.UrlImgUp.Secure(true).ResourceType(resourceTypeStr).Signed(true).Version("1788590169");
        var signedUrl = builder.BuildUrl(fullPublicId);

        var client = new HttpClient();
        var res = await client.GetAsync(signedUrl);
        Console.WriteLine($"URL: {signedUrl}");
        Console.WriteLine($"Status: {res.StatusCode}");
        
        if (res.Headers.TryGetValues("x-cld-error", out var cldErrors))
        {
            Console.WriteLine($"Cloudinary Error: {string.Join(", ", cldErrors)}");
        }
    }
}

using System.IO;
using System.Linq;
using System.Collections.Generic;

namespace WukalaGPT.Infrastructure.Helpers;

public static class FileValidationHelper
{
    private static readonly Dictionary<string, List<byte[]>> _fileSignatures = new()
    {
        { ".jpeg", new List<byte[]> { new byte[] { 0xFF, 0xD8, 0xFF } } },
        { ".jpg", new List<byte[]> { new byte[] { 0xFF, 0xD8, 0xFF } } },
        { ".png", new List<byte[]> { new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A } } },
        { ".pdf", new List<byte[]> { new byte[] { 0x25, 0x50, 0x44, 0x46 } } },
        { ".doc", new List<byte[]> { new byte[] { 0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1 } } },
        { ".docx", new List<byte[]> { new byte[] { 0x50, 0x4B, 0x03, 0x04 } } },
        { ".mp4", new List<byte[]> { 
            new byte[] { 0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x6D, 0x70, 0x34, 0x32 },
            new byte[] { 0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x6D, 0x70, 0x34, 0x32 },
            new byte[] { 0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6F, 0x6D },
            new byte[] { 0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6F, 0x6D }
        } }
    };

    public static bool IsValidFileSignature(string fileName, Stream fileStream)
    {
        if (string.IsNullOrEmpty(fileName) || fileStream == null || fileStream.Length == 0)
            return false;

        var ext = Path.GetExtension(fileName).ToLowerInvariant();

        if (string.IsNullOrEmpty(ext) || !_fileSignatures.ContainsKey(ext))
            return false;

        var signatures = _fileSignatures[ext];
        var maxSignatureLength = signatures.Max(m => m.Length);

        if (fileStream.Length < maxSignatureLength)
            return false;

        var headerBytes = new byte[maxSignatureLength];
        
        fileStream.Position = 0;
        fileStream.ReadExactly(headerBytes, 0, headerBytes.Length);
        fileStream.Position = 0; // Reset position for further processing

        return signatures.Any(signature => 
            headerBytes.Take(signature.Length).SequenceEqual(signature));
    }
}

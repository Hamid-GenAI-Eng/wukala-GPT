namespace WukalaGPT.Domain.Enums;

[Flags]
public enum LawyerBadge
{
    None = 0,
    Verified = 1 << 0,          // 1
    RisingTalent = 1 << 1,      // 2
    TopRated = 1 << 2,          // 4
    ClientRecommended = 1 << 3  // 8
}

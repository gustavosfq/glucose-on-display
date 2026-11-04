export type Region = "US" | "EU" | "AP" | "AU" | "AE" | "JP";

export const REGIONS: Record<Region, string> = {
  US: "United States",
  EU: "Europe / Latin America",
  AP: "Asia Pacific",
  AU: "Australia",
  AE: "United Arab Emirates",
  JP: "Japan"
};

export function detectRegion(email: string): Region {
  // Heurística simple basada en el dominio del email
  const domain = email.split("@")[1]?.toLowerCase();
  
  if (!domain) return "EU"; // Default
  
  // Dominios comunes por región
  if (domain.endsWith(".mx") || domain.endsWith(".ar") || 
      domain.endsWith(".cl") || domain.endsWith(".co") ||
      domain.endsWith(".pe") || domain.endsWith(".ve") ||
      domain.endsWith(".br")) {
    return "EU"; // LATAM usa servidores EU
  }
  
  if (domain.endsWith(".jp")) return "JP";
  if (domain.endsWith(".au")) return "AU";
  if (domain.endsWith(".ae")) return "AE";
  if (domain.endsWith(".us")) return "US";
  
  // Default para .com y otros (la mayoría usa EU)
  return "EU";
}

export const SKIP_SHEETS = ["Dashboard", "Optic", "Location", "Immobile", "Moto"];

export const MESSAGES_MAP: Record<string, string> = {
  Doctors: `Bonjour Docteur,

J'ai vu votre cabinet en ligne et je voulais vous contacter directement.

Beaucoup de patients cherchent leur médecin sur Google avant d'appeler — un site simple avec vos spécialités, vos horaires et un bouton de contact peut vous amener des rendez-vous qualifiés sans effort.

Ila mssali 15 min, nwriik concretement chno ymkn dir — si vous êtes intéressé.`,

  Location: `Salam khoya,

Tl3 lia business dialk f location de voiture — clients kaybghiw ireserviw ligne directement, surtout la nuit ou le week-end.

Un site web bsit b photos dyal véhicules, les tarifs, o bouton WhatsApp — kifach clients kayl9awk facilement o kaytaslw bik.

Ila mssali 15 min, nwriik concretement chno ymkn dir — ila intéressé.`,

  Immobile: `Salam khoya,

Tl3 lia business dialk f immobilier — les acheteurs kaybghiw ychofu les biens en ligne avant ma ytaslw b ay agence.

Un site b photos, filtres o formulaire de contact ymkn yjib lak leads qualifiés — bla ma t9ed 3la Mubawab wla Avito.

Ila mssali 15 min, nwriik concretement chno ymkn dir — ila intéressé.`,

  Immobilier: `Salam khoya,

Tl3 lia business dialk f immobilier — les acheteurs kaybghiw ychofu les biens en ligne avant ma ytaslw b ay agence.

Un site b photos, filtres o formulaire de contact ymkn yjib lak leads qualifiés — bla ma t9ed 3la Mubawab wla Avito.

Ila mssali 15 min, nwriik concretement chno ymkn dir — ila intéressé.`,

  Moto: `Salam khoya,

Tl3 lia business dialk f motos — clients kaybghiw ychofu les pièces, les prix o les services dialk 9bal ma yjiw.

Un site bsit b catalogue, services o bouton WhatsApp — ymkn yjib lak clients jdad mn Google bla ma tdepenssi f pub.

Ila mssali 15 min, nwriik concretement chno ymkn dir — ila intéressé.`,

  Optic: `Salam khoya,

Tl3 lia magasin optic dialk — clients kaybghiw ychofu collection dyal lunettes o les services dialk 9bal ma yjiw.

Un site b galerie, promotions o prise de rendez-vous ymkn yjib lak clients jdad o yfarq bink o l9y competition.

Ila mssali 15 min, nwriik concretement chno ymkn dir — ila intéressé.`,
};

export const CATEGORIES = [
  { name: "Doctors", label: "Doctors", icon: "stethoscope", color: "#22c55e" },
  { name: "Location", label: "Location", icon: "car", color: "#6366f1" },
  { name: "Immobile", label: "Immobile", icon: "building", color: "#f59e0b" },
  { name: "Moto", label: "Moto", icon: "bike", color: "#ef4444" },
  { name: "Optic", label: "Optic", icon: "glasses", color: "#8b5cf6" },
];

export function formatPhoneForWhatsApp(phone: string): string | null {
  const cleaned = phone.replace(/\D/g, "");
  if (!cleaned) return null;
  if (cleaned.startsWith("05") || cleaned.startsWith("5")) return null;
  if (cleaned.startsWith("0")) return `+212${cleaned.slice(1)}`;
  if (cleaned.startsWith("212")) return `+${cleaned}`;
  return `+212${cleaned}`;
}

import { MessageCircle } from "lucide-react";
import { productMessage, whatsappLink } from "@/lib/whatsapp";

const priceValue = (p?: string) => p?.replace(/,/g, "").match(/₹\s*(\d+)/)?.[1];

type Props = {
  product: Parameters<typeof productMessage>[0];
  label?: string;
  size?: "sm" | "lg";
  className?: string;
};

// Green "Book on WhatsApp" button that opens a chat with the product details pre-typed.
export function WhatsAppButton({ product, label = "Book on WhatsApp", size = "sm", className = "" }: Props) {
  const sizing = size === "lg" ? "h-12 px-6 text-base" : "h-9 px-3 text-sm";
  return (
    <a
      href={whatsappLink(productMessage(product))}
      target="_blank"
      rel="noreferrer"
      aria-label={`${label}: ${product.title}`}
      data-lead-source="product_button"
      data-lead-item={product.title}
      data-lead-value={priceValue(product.price)}
      className={`inline-flex items-center justify-center gap-2 rounded-md bg-[#25D366] font-bold text-white shadow-sm transition-colors hover:bg-[#1ebe5b] ${sizing} ${className}`}
    >
      <MessageCircle className={size === "lg" ? "size-5" : "size-4"} />
      {label}
    </a>
  );
}

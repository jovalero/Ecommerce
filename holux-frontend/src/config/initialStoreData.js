// Store design exported from local configuration
export const initialStoreData = {
  "hero_slides": [
    {
      "title": "",
      "span": "",
      "desc": "",
      "highlight": "",
      "cta": "VER CATÁLOGO",
      "image": "https://fmbhcfsrsfkglmvgbnlm.supabase.co/storage/v1/object/public/banners/hero_slide_1_desktop.jpg",
      "mobileImage": "https://fmbhcfsrsfkglmvgbnlm.supabase.co/storage/v1/object/public/banners/hero_slide_1_mobile.png",
      "overlayOpacity": 0,
      "link": "#/catalogo",
      "isActive": true
    },
    {
      "title": "",
      "span": "",
      "desc": "",
      "highlight": "",
      "cta": "",
      "image": "https://fmbhcfsrsfkglmvgbnlm.supabase.co/storage/v1/object/public/banners/hero_slide_2_desktop.jpg",
      "mobileImage": "https://fmbhcfsrsfkglmvgbnlm.supabase.co/storage/v1/object/public/banners/hero_slide_2_mobile.jpg",
      "overlayOpacity": 0,
      "link": "#/catalogo",
      "isActive": true
    }
  ],
  "grid_cards": [
    {
      "title": "FRAGANCIAS HOMBRE",
      "span": "ELEGANCIA Y CARÁCTER",
      "image": "/banners/626f05d5-d503-48d9-aa07-daa0f2901b90.jpg",
      "link": "#/catalogo?categoria=perfumes-hombre"
    },
    {
      "title": "FRAGANCIAS MUJER",
      "span": "SOFISTICACIÓN Y FRESCURA",
      "image": "/banners/5a3091ff-8cf1-4622-96a2-ddc75f228075.jpg",
      "link": "#/catalogo?categoria=perfumes-mujer"
    },
    {
      "title": "EXCLUSIVIDAD Y TENDENCIA",
      "span": "JOYAS DE LA PERFUMERÍA ORIENTAL",
      "image": "/banners/89ada2e8-6101-48ce-9853-73762e7bddc0.jpg",
      "link": "#/catalogo"
    }
  ],
  "promo_banner": {
    "tag": "ENVÍOS A TODO EL PAÍS",
    "title": "RECIBÍ TU PERFUME SIN MOVERTE DE CASA",
    "description": "Realizamos envíos rápidos y seguros para que disfrutes tu fragancia favorita.",
    "isVisible": true
  },
  "section_titles": {
    "novedadesTitle": "NUEVOS INGRESOS",
    "novedadesSubtitle": "Descubrí las últimas fragancias disponibles en nuestra tienda.",
    "destacadosTitle": "PRODUCTOS DESTACADOS",
    "destacadosSubtitle": "Una selección especial recomendada por nuestros expertos"
  },
  "ticker": [
    "| ENVÍO GRATIS EN COMPRAS MAYORES A $150.000",
    "| ¡HASTA 6 CUOTAS SIN INTERÉS!",
    "| GARANTÍA OFICIAL HOLUX EN TODAS TUS EXPEDICIONES",
    "| 15% OFF PAGANDO CON TRANSFERENCIA BANCARIA"
  ],
  "header_nav": [
    {
      "id": "cat_dropdown",
      "type": "dropdown",
      "label": "CATEGORÍAS",
      "isVisible": true,
      "isDropdown": true,
      "link": "#/catalogo"
    },
    {
      "id": "cat_perfumes-hombre",
      "type": "category",
      "label": "PERFUMES HOMBRE",
      "slug": "perfumes-hombre",
      "link": "#/catalogo?categoria=perfumes-hombre",
      "isVisible": true
    },
    {
      "id": "cat_perfumes-mujer",
      "type": "category",
      "label": "PERFUMES MUJER",
      "slug": "perfumes-mujer",
      "link": "#/catalogo?categoria=perfumes-mujer",
      "isVisible": true
    },
    {
      "id": "outlet",
      "type": "special",
      "label": "OUTLET",
      "link": "#/catalogo?genero=outlet",
      "isVisible": true,
      "isButton": true
    }
  ]
};

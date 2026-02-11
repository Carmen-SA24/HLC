// Diccionarios de traducción para cada idioma soportado
const dictionaries = {
  en: {
    title: "Welcome to my multilingual page",
    description: "This is a simple page that can be translated into Spanish, English and French.",
    home: "Home",
    generations: "Generations",
    contact: "Contact",
    generationTitle: "Generation",
    contactTitle: "Contact",
    nameLabel: "Name",
    namePlaceholder: "Your name",
    emailLabel: "Email",
    emailPlaceholder: "name@example.com",
    messageLabel: "Message",
    messagePlaceholder: "What do you want to tell us?",
    submitButton: "Send Message",
    footerDevelopedWith: "Application developed with NextJS",
    footerText: "All rights reserved. PokeNext © 2026",
  },
  es: {
    title: "Bienvenido a mi página multilingüe",
    description: "Esta es una página sencilla que se puede traducir al español, inglés y francés.",
    home: "Inicio",
    generations: "Generaciones",
    contact: "Contacto",
    generationTitle: "Generación",
    contactTitle: "Contacto",
    nameLabel: "Nombre",
    namePlaceholder: "Tu nombre",
    emailLabel: "Correo Electrónico",
    emailPlaceholder: "nombre@ejemplo.com",
    messageLabel: "Mensaje",
    messagePlaceholder: "¿Qué quieres decirnos?",
    submitButton: "Enviar Mensaje",
    footerDevelopedWith: "Aplicación desarrollada con NextJS",
    footerText: "Todos los derechos reservados. PokeNext © 2026",
  },
  fr: {
    title: "Bienvenue sur ma page multilingue",
    description: "Ceci est une page simple qui peut être traduite en espagnol, anglais et français.",
    home: "Accueil",
    generations: "Générations",
    contact: "Contact",
    generationTitle: "Génération",
    contactTitle: "Contact",
    nameLabel: "Nom",
    namePlaceholder: "Votre nom",
    emailLabel: "E-mail",
    emailPlaceholder: "nom@exemple.com",
    messageLabel: "Message",
    messagePlaceholder: "Que voulez-vous nous dire?",
    submitButton: "Envoyer le message",
    footerDevelopedWith: "Application développée avec NextJS",
    footerText: "Tous droits réservés. PokeNext © 2026",
  },
};


// Devuelve el diccionario según el idioma, por defecto español
export const getDictionary = (lang) => {
  if (!dictionaries[lang]) {
    return dictionaries['es'];
  }
  return dictionaries[lang];
};

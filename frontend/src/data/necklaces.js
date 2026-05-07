import chokerImg from "../assets/necklaces/choker.png";
import pendantImg from "../assets/necklaces/pendant.png";
import layeredImg from "../assets/necklaces/layered.png";
import tennisImg from "../assets/necklaces/tennis.png";
import operaImg from "../assets/necklaces/opera.png";
import diamondImg from "../assets/necklaces/diamond.png";
import floralImg from "../assets/necklaces/floral.png";

export const NECKLACE_CATALOGUE = [
  {
    id: "choker",
    name: "Ruby Choker",
    type: "Collar · 35 cm",
    price: "$285",
    yOffset: -0.01,
    widthRatio: 0.82,
    scale: 1.15,
    src: chokerImg,
    description:
      "A sleek, close-fitting collar that sits at the base of the throat. Crafted in 18k gold vermeil with a delicate pavé center stone.",
  },
  {
    id: "pendant",
    name: "Lumière Pendant",
    type: "Princess · 45 cm",
    price: "$420",
    yOffset: 0.06,
    widthRatio: 0.95,
    scale: 0.95,
    src: pendantImg,
    description:
      "Our signature pendant featuring a hand-set rose-cut diamond suspended from a fine trace chain. The defining piece of the atelier.",
  },
  {
    id: "layered",
    name: "Cascade Layers",
    type: "Multi-strand · 50 cm",
    price: "$560",
    yOffset: 0.06,
    widthRatio: 0.6,
    scale: 1.35,
    src: layeredImg,
    description:
      "Two chains worn together, each set with a diamond piece. Effortlessly stacks with other pieces.",
  },
  {
    id: "diamond",
    name: "Diamonds in Bloom",
    type: "Diamond · 40 cm",
    price: "$5600",
    yOffset: -0.03,
    widthRatio: 0.6,
    scale: 1.3,
    src: diamondImg,
    description:
      "A stunning diamond necklace with many stones. A modern take on the classic tennis necklace, with clusters of diamonds in varying sizes for a blooming effect.",
  },
  {
    id: "tennis",
    name: "Éclat Tennis",
    type: "Diamond line · 42 cm",
    price: "$1,240",
    yOffset: 0.01,
    widthRatio: 0.65,
    scale: 1.25,
    src: tennisImg,
    description:
      "Forty-two brilliant-cut diamonds in a seamless prong setting. The tennis necklace, perfected. Available in white, yellow, and rose gold.",
  },
  {
    id: "opera",
    name: "Opéra Grande",
    type: "Opéra · 90 cm",
    price: "$740",
    yOffset: -0.11,
    widthRatio: 0.7,
    scale: 1.35,
    src: operaImg,
    description:
      "A dramatic opera necklace, with white and yellow gems. Perfect to make a statement and turn heads at your next soirée.",
  },
  {
    id: "floral",
    name: "Floral Fantasy",
    type: "Multi-strand · 55 cm",
    price: "$670",
    yOffset: 0.03,
    widthRatio: 0.6,
    scale: 1.15,
    src: floralImg,
    description:
      "A beautiful floral-inspired layered necklace with delicate pink details and a romantic feel.",
  },
];

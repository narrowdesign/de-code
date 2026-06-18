// The concept graph: every concept is defined only by its relationships to other concepts.
// Nothing is atomic — it's threads all the way down.

export interface ConceptLink {
  target: string;
  weight: number; // 0-1, how strongly related
}

export interface ConceptNode {
  id: string;
  links: ConceptLink[];
  color?: string; // base hue for this concept family
}

// Seed knowledge graph — rich enough to demonstrate the fractal structure
const CONCEPT_DATA: Record<string, { links: [string, number][]; color?: string }> = {
  "Steve Jobs": {
    links: [
      ["Apple", 0.95], ["iPhone", 0.9], ["Macintosh", 0.85], ["Pixar", 0.7],
      ["Turtleneck", 0.6], ["Think Different", 0.8], ["Wozniak", 0.75],
      ["Silicon Valley", 0.7], ["Design", 0.8], ["Innovation", 0.7],
      ["Stanford", 0.5], ["Zen Buddhism", 0.5], ["Calligraphy", 0.4],
      ["NeXT", 0.65], ["Reality Distortion", 0.6], ["Garage", 0.5],
      ["Typography", 0.5], ["Simplicity", 0.7], ["Perfectionism", 0.6],
      ["1984 Ad", 0.55], ["Lisa", 0.4], ["iPad", 0.7],
    ],
    color: "hsl(220, 70%, 60%)",
  },
  "Apple": {
    links: [
      ["Steve Jobs", 0.9], ["iPhone", 0.95], ["Macintosh", 0.9], ["Design", 0.85],
      ["Silicon Valley", 0.8], ["Wozniak", 0.7], ["Innovation", 0.8],
      ["App Store", 0.75], ["iOS", 0.8], ["Safari", 0.5],
      ["Tim Cook", 0.7], ["Jony Ive", 0.8], ["Cupertino", 0.6],
      ["Fruit", 0.3], ["Newton", 0.35], ["Rainbow Logo", 0.4],
      ["Think Different", 0.7], ["1984 Ad", 0.6], ["iPad", 0.8],
      ["Apple Music", 0.5], ["Simplicity", 0.7], ["Premium", 0.6],
    ],
    color: "hsl(0, 0%, 70%)",
  },
  "iPhone": {
    links: [
      ["Apple", 0.95], ["Steve Jobs", 0.85], ["Touchscreen", 0.9],
      ["App Store", 0.85], ["iOS", 0.9], ["Camera", 0.7],
      ["Smartphone", 0.9], ["Mobile", 0.8], ["Design", 0.7],
      ["Samsung", 0.5], ["Glass", 0.5], ["Gorilla Glass", 0.4],
      ["Retina Display", 0.6], ["Siri", 0.6], ["Communication", 0.7],
      ["Photography", 0.5], ["Social Media", 0.5], ["Innovation", 0.7],
    ],
    color: "hsl(210, 60%, 65%)",
  },
  "Design": {
    links: [
      ["Apple", 0.8], ["Jony Ive", 0.85], ["Simplicity", 0.8],
      ["Bauhaus", 0.7], ["Dieter Rams", 0.75], ["Form", 0.7],
      ["Function", 0.7], ["Beauty", 0.7], ["Typography", 0.7],
      ["Color", 0.6], ["Minimalism", 0.75], ["Architecture", 0.6],
      ["Steve Jobs", 0.7], ["User Experience", 0.8], ["Craft", 0.6],
      ["Proportion", 0.6], ["Grid", 0.5], ["White Space", 0.6],
    ],
    color: "hsl(330, 60%, 60%)",
  },
  "Innovation": {
    links: [
      ["Steve Jobs", 0.7], ["Apple", 0.7], ["Silicon Valley", 0.8],
      ["Technology", 0.85], ["Creativity", 0.8], ["Disruption", 0.7],
      ["Invention", 0.8], ["Edison", 0.6], ["Tesla", 0.6],
      ["Research", 0.7], ["Science", 0.7], ["Progress", 0.7],
      ["Risk", 0.5], ["Failure", 0.5], ["Iteration", 0.6],
      ["Prototype", 0.6], ["Design", 0.7], ["Engineering", 0.7],
    ],
    color: "hsl(45, 70%, 55%)",
  },
  "Silicon Valley": {
    links: [
      ["Apple", 0.8], ["Google", 0.8], ["Stanford", 0.75],
      ["Startup", 0.85], ["Venture Capital", 0.8], ["Technology", 0.85],
      ["Innovation", 0.8], ["San Francisco", 0.6], ["Garage", 0.6],
      ["Steve Jobs", 0.7], ["Elon Musk", 0.6], ["Facebook", 0.7],
      ["Code", 0.7], ["Engineer", 0.7], ["Disruption", 0.6],
      ["California", 0.6], ["Wealth", 0.5], ["Campus", 0.5],
    ],
    color: "hsl(150, 50%, 50%)",
  },
  "Macintosh": {
    links: [
      ["Apple", 0.9], ["Steve Jobs", 0.8], ["Wozniak", 0.6],
      ["1984 Ad", 0.7], ["GUI", 0.8], ["Mouse", 0.7],
      ["Personal Computer", 0.85], ["Xerox PARC", 0.6], ["Desktop", 0.7],
      ["Typography", 0.6], ["Design", 0.7], ["Lisa", 0.5],
      ["Finder", 0.5], ["Operating System", 0.7], ["Revolution", 0.6],
    ],
    color: "hsl(200, 50%, 55%)",
  },
  "Pixar": {
    links: [
      ["Steve Jobs", 0.75], ["Animation", 0.95], ["Toy Story", 0.9],
      ["Disney", 0.8], ["Computer Graphics", 0.85], ["Storytelling", 0.8],
      ["Creativity", 0.75], ["John Lasseter", 0.7], ["RenderMan", 0.6],
      ["Imagination", 0.7], ["Film", 0.8], ["Art", 0.7],
      ["Technology", 0.7], ["Innovation", 0.6], ["Emeryville", 0.4],
    ],
    color: "hsl(120, 60%, 50%)",
  },
  "Wozniak": {
    links: [
      ["Apple", 0.85], ["Steve Jobs", 0.8], ["Engineering", 0.85],
      ["Hardware", 0.8], ["Circuit Board", 0.7], ["Garage", 0.6],
      ["Homebrew", 0.6], ["Apple II", 0.8], ["Hacker", 0.7],
      ["Silicon Valley", 0.6], ["Philanthropy", 0.4], ["Teaching", 0.4],
    ],
    color: "hsl(180, 50%, 50%)",
  },
  "Think Different": {
    links: [
      ["Apple", 0.85], ["Steve Jobs", 0.8], ["Creativity", 0.7],
      ["Einstein", 0.5], ["Gandhi", 0.5], ["Lennon", 0.5],
      ["Advertising", 0.7], ["Brand", 0.7], ["Rebellion", 0.6],
      ["Innovation", 0.6], ["Individuality", 0.7], ["Culture", 0.5],
    ],
    color: "hsl(280, 60%, 60%)",
  },
  "Turtleneck": {
    links: [
      ["Steve Jobs", 0.8], ["Fashion", 0.6], ["Simplicity", 0.5],
      ["Black", 0.5], ["Issey Miyake", 0.6], ["Uniform", 0.5],
      ["Minimalism", 0.5], ["Identity", 0.4], ["Iconic", 0.5],
    ],
    color: "hsl(0, 0%, 30%)",
  },
  "Simplicity": {
    links: [
      ["Design", 0.85], ["Apple", 0.7], ["Minimalism", 0.85],
      ["Steve Jobs", 0.65], ["Zen Buddhism", 0.6], ["Elegance", 0.7],
      ["Clarity", 0.7], ["White Space", 0.6], ["Dieter Rams", 0.6],
      ["Less Is More", 0.8], ["Focus", 0.6], ["Beauty", 0.6],
    ],
    color: "hsl(50, 30%, 70%)",
  },
  "Jony Ive": {
    links: [
      ["Apple", 0.9], ["Design", 0.95], ["Steve Jobs", 0.7],
      ["Aluminum", 0.5], ["Minimalism", 0.7], ["Dieter Rams", 0.6],
      ["iPhone", 0.7], ["Macintosh", 0.6], ["Craft", 0.7],
      ["British", 0.4], ["Perfectionism", 0.6], ["Unibody", 0.5],
    ],
    color: "hsl(210, 40%, 65%)",
  },
  "Zen Buddhism": {
    links: [
      ["Steve Jobs", 0.6], ["Simplicity", 0.7], ["Meditation", 0.8],
      ["Japan", 0.7], ["Mindfulness", 0.8], ["Emptiness", 0.6],
      ["Garden", 0.5], ["Calligraphy", 0.5], ["Wabi-Sabi", 0.6],
      ["Enlightenment", 0.6], ["Breath", 0.5], ["Presence", 0.6],
    ],
    color: "hsl(90, 30%, 55%)",
  },
  "Typography": {
    links: [
      ["Design", 0.85], ["Calligraphy", 0.7], ["Steve Jobs", 0.5],
      ["Font", 0.85], ["Helvetica", 0.7], ["Serif", 0.6],
      ["Readability", 0.7], ["Gutenberg", 0.5], ["Print", 0.6],
      ["Communication", 0.6], ["Letter", 0.6], ["Spacing", 0.6],
    ],
    color: "hsl(0, 0%, 45%)",
  },
  "Technology": {
    links: [
      ["Innovation", 0.85], ["Silicon Valley", 0.8], ["Science", 0.8],
      ["Engineering", 0.8], ["Computer", 0.8], ["Internet", 0.8],
      ["Software", 0.8], ["Hardware", 0.7], ["AI", 0.7],
      ["Progress", 0.7], ["Code", 0.7], ["Digital", 0.7],
      ["Future", 0.6], ["Automation", 0.6], ["Robot", 0.5],
    ],
    color: "hsl(200, 70%, 50%)",
  },
  "Creativity": {
    links: [
      ["Innovation", 0.8], ["Art", 0.85], ["Design", 0.8],
      ["Imagination", 0.85], ["Music", 0.7], ["Writing", 0.7],
      ["Think Different", 0.6], ["Inspiration", 0.8], ["Flow", 0.6],
      ["Originality", 0.7], ["Expression", 0.7], ["Play", 0.5],
    ],
    color: "hsl(300, 60%, 55%)",
  },
  "Bauhaus": {
    links: [
      ["Design", 0.85], ["Architecture", 0.8], ["Minimalism", 0.7],
      ["Germany", 0.6], ["Form", 0.7], ["Function", 0.7],
      ["Modernism", 0.8], ["Grid", 0.6], ["Geometry", 0.6],
      ["Gropius", 0.6], ["Kandinsky", 0.5], ["Art", 0.7],
    ],
    color: "hsl(10, 70%, 55%)",
  },
  "Dieter Rams": {
    links: [
      ["Design", 0.9], ["Braun", 0.8], ["Simplicity", 0.8],
      ["Less Is More", 0.8], ["Jony Ive", 0.7], ["Function", 0.7],
      ["German Design", 0.7], ["Ten Principles", 0.7], ["Modernism", 0.6],
      ["Minimalism", 0.7], ["Apple", 0.5], ["Industrial Design", 0.8],
    ],
    color: "hsl(40, 40%, 50%)",
  },
  "NeXT": {
    links: [
      ["Steve Jobs", 0.85], ["Apple", 0.6], ["Computer", 0.7],
      ["Operating System", 0.7], ["Cube", 0.6], ["Education", 0.5],
      ["Object-Oriented", 0.6], ["Tim Berners-Lee", 0.5], ["Web", 0.5],
      ["Workstation", 0.6], ["Black", 0.4], ["Return", 0.5],
    ],
    color: "hsl(270, 40%, 40%)",
  },
  "1984 Ad": {
    links: [
      ["Apple", 0.8], ["Macintosh", 0.8], ["Steve Jobs", 0.6],
      ["Super Bowl", 0.6], ["Ridley Scott", 0.6], ["Orwell", 0.6],
      ["IBM", 0.5], ["Revolution", 0.6], ["Advertising", 0.7],
      ["Television", 0.5], ["Iconic", 0.6], ["Culture", 0.5],
    ],
    color: "hsl(0, 60%, 45%)",
  },
};

// Additional concepts that can be generated on-the-fly for deeper zoom levels
const GENERATIVE_SEEDS: Record<string, [string, number][]> = {
  "Music": [
    ["Sound", 0.8], ["Rhythm", 0.8], ["Melody", 0.8], ["Harmony", 0.7],
    ["Instrument", 0.7], ["Creativity", 0.7], ["Emotion", 0.7], ["Apple Music", 0.4],
    ["Beatles", 0.5], ["Culture", 0.6], ["Expression", 0.7], ["Lennon", 0.5],
  ],
  "Science": [
    ["Research", 0.8], ["Experiment", 0.8], ["Theory", 0.8], ["Mathematics", 0.7],
    ["Physics", 0.7], ["Biology", 0.6], ["Discovery", 0.7], ["Einstein", 0.6],
    ["Technology", 0.7], ["Nature", 0.6], ["Truth", 0.5], ["Observation", 0.7],
  ],
  "Art": [
    ["Creativity", 0.85], ["Beauty", 0.7], ["Expression", 0.8], ["Color", 0.7],
    ["Form", 0.7], ["Museum", 0.6], ["Painting", 0.7], ["Sculpture", 0.6],
    ["Culture", 0.6], ["Emotion", 0.7], ["Design", 0.6], ["Imagination", 0.7],
  ],
  "Architecture": [
    ["Design", 0.8], ["Building", 0.8], ["Space", 0.7], ["Structure", 0.8],
    ["Bauhaus", 0.6], ["Geometry", 0.6], ["Light", 0.6], ["Material", 0.7],
    ["City", 0.6], ["Form", 0.7], ["Function", 0.7], ["Beauty", 0.5],
  ],
  "Internet": [
    ["Web", 0.9], ["Technology", 0.8], ["Communication", 0.8], ["Social Media", 0.7],
    ["Google", 0.7], ["Email", 0.6], ["Browser", 0.6], ["Network", 0.8],
    ["Information", 0.7], ["Tim Berners-Lee", 0.6], ["Digital", 0.7], ["Freedom", 0.5],
  ],
};

class ConceptGraph {
  private nodes: Map<string, ConceptNode> = new Map();

  constructor() {
    // Load seed data
    for (const [id, data] of Object.entries(CONCEPT_DATA)) {
      this.nodes.set(id, {
        id,
        links: data.links.map(([target, weight]) => ({ target, weight })),
        color: data.color,
      });
    }
    // Load generative seeds
    for (const [id, links] of Object.entries(GENERATIVE_SEEDS)) {
      if (!this.nodes.has(id)) {
        this.nodes.set(id, {
          id,
          links: links.map(([target, weight]) => ({ target, weight })),
        });
      }
    }
  }

  getNode(id: string): ConceptNode | undefined {
    return this.nodes.get(id);
  }

  // Get or procedurally generate a concept's relationships
  getOrGenerate(id: string): ConceptNode {
    const existing = this.nodes.get(id);
    if (existing) return existing;

    // Procedurally generate: find all concepts that reference this one
    const reverseLinks: ConceptLink[] = [];
    this.nodes.forEach((node, nodeId) => {
      for (const link of node.links) {
        if (link.target === id) {
          reverseLinks.push({ target: nodeId, weight: link.weight * 0.8 });
        }
      }
    });

    // Generate some plausible abstract connections
    const generated: ConceptNode = {
      id,
      links: reverseLinks.length > 0 ? reverseLinks : [
        { target: "Creativity", weight: 0.3 },
        { target: "Culture", weight: 0.3 },
      ],
    };

    this.nodes.set(id, generated);
    return generated;
  }

  getAllNodeIds(): string[] {
    return Array.from(this.nodes.keys());
  }

  // Get the top-level concepts (most connected)
  getTopConcepts(count: number = 8): string[] {
    const scored = Array.from(this.nodes.entries()).map(([id, node]) => {
      const outWeight = node.links.reduce((s, l) => s + l.weight, 0);
      // Also count incoming references
      let inWeight = 0;
      this.nodes.forEach((other) => {
        for (const link of other.links) {
          if (link.target === id) inWeight += link.weight;
        }
      });
      return { id, score: outWeight + inWeight };
    });
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, count).map(s => s.id);
  }

  // Get color for a concept, generating one if needed
  getColor(id: string): string {
    const node = this.nodes.get(id);
    if (node?.color) return node.color;
    // Generate a deterministic color from the name
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = ((hash % 360) + 360) % 360;
    return `hsl(${hue}, 55%, 58%)`;
  }
}

// Singleton
export const conceptGraph = new ConceptGraph();

// Utility: convert HSL string to hex for Three.js
export function hslToHex(hsl: string): string {
  const match = hsl.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (!match) return "#888888";
  const h = parseInt(match[1]) / 360;
  const s = parseInt(match[2]) / 100;
  const l = parseInt(match[3]) / 100;

  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

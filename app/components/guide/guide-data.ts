/** Seedance 2.0 Prompt Guide content — cloned from seedance2.ai/guide */

export type GuideMediaCol = {
  badge: string | null;
  videos: string[];
  images: { src: string; alt: string; caption: string }[];
};

export type GuideExample = {
  id: string;
  title: string;
  subsectionId: string;
  cols: GuideMediaCol[];
  prompt: string;
};

export type GuideSubsection = {
  id: string;
  title: string;
  intro?: string;
  formula?: string;
  notes?: string[];
  examples: GuideExample[];
  special?: "formula" | "multimodal";
};

export type GuideSection = {
  id: string;
  number: string;
  title: string;
  intro?: string;
  icon: "book" | "type" | "image" | "video" | "scissors";
  subsections: GuideSubsection[];
};

export const GUIDE_HERO = {
  title: "{{appName}} Prompt Guide",
  description:
    "Master the art of prompting to create stunning AI-generated videos on {{appName}}. This guide covers prompt techniques, multimodal references, and real-world examples for Seedance 2.0 (also applicable to Seedance 2.0 Fast).",
} as const;

export const FORMULA_CARDS = [
  {
    badge: "Required",
    badgeTone: "required" as const,
    title: "Subject",
    description:
      "The logical foundation of your prompt — clearly define WHO is performing WHAT action.",
  },
  {
    badge: "Required",
    badgeTone: "required" as const,
    title: "Motion",
    description:
      "The logical foundation of your prompt — clearly define WHO is performing WHAT action.",
  },
  {
    badge: "Optional",
    badgeTone: "optional" as const,
    title: "Environment",
    description:
      "Describe the spatial background, lighting details, or a specific visual style to set the overall tone.",
  },
  {
    badge: "Optional",
    badgeTone: "optional" as const,
    title: "Aesthetics",
    description:
      "Describe the spatial background, lighting details, or a specific visual style to set the overall tone.",
  },
  {
    badge: "Optional",
    badgeTone: "optional" as const,
    title: "Camera",
    description:
      "Use camera choreography or ambient sound effects for immersive audiovisual output.",
  },
  {
    badge: "Optional",
    badgeTone: "optional" as const,
    title: "Audio",
    description:
      "Use camera choreography or ambient sound effects for immersive audiovisual output.",
  },
] as const;

export const MULTIMODAL_CARDS = [
  {
    title: "Clearly Specify References",
    description:
      'In your prompt, clearly specify what to reference — e.g., "use the composition from Image 1" or "follow the action from Video 2".',
  },
  {
    title: "Precise Reproduction",
    description:
      "The model automatically extracts core features from reference objects and combines them with your text description, ensuring high fidelity and creativity in the output.",
  },
] as const;

export const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: "general-tips",
    number: "01",
    title: "General Tips",
    icon: "book",
    subsections: [
      {
        id: "1-1",
        title: "1.1 Basic Prompt Formula",
        intro:
          "Seedance 2.0 deeply follows natural language logic, so you can flexibly combine the following elements based on your needs.",
        special: "formula",
        examples: [],
      },
      {
        id: "1-2",
        title: "1.2 Multimodal Reference Control",
        intro: `Beyond text descriptions, you can also "feed" reference materials to lock in the ideal standard for your visuals. Seedance 2.0 supports deep referencing of images, audio, and video.`,
        special: "multimodal",
        examples: [],
      },
    ],
  },
  {
    id: "text-in-video",
    number: "02",
    title: "Text in Video",
    icon: "type",
    intro:
      "Seedance 2.0 supports generating text overlays in T2V (text-to-video), I2V (image-to-video), R2V (reference-to-video), and V2V (video-to-video) scenarios. The model can automatically match appropriate styles and colors based on context, and also supports specifying text color, style, appearance method, timing, and position in your prompt. Use common characters and avoid rare characters or special symbols for best results.",
    subsections: [
      {
        id: "2-1",
        title: "2.1 Slogan / Title Text",
        formula:
          "[Text Content] + [Appearance Timing] + [Position] + [Appearance Method], [Text Style (color, font)]",
        notes: [
          "Seedance 2.0 can automatically match appropriate text styles based on context. For stricter text appearance requirements, refer to section 3.2 Multi-image Reference > Logo Reference.",
        ],
        examples: [
          {
            id: "animated-slogan-with-product",
            title: "Animated Slogan with Product",
            subsectionId: "2-1",
            cols: [
              {
                badge: "Output",
                videos: [
                  "https://cdn.vidrushai.com/seedance2-guide/output/output-video-1.mp4",
                ],
                images: [],
              },
              {
                badge: "Reference Input",
                videos: [],
                images: [
                  {
                    src: "https://cdn.vidrushai.com/seedance2-guide/input/input-image-1.webp",
                    alt: "Image 1",
                    caption: "Image 1",
                  },
                ],
              },
            ],
            prompt:
              'Hand-drawn comic style, three people sitting together eating the fried chicken from Image 1, the atmosphere is friendly and joyful, then the scene gradually blurs, and the text "Joy is in Seedance" appears in the center of the screen.',
          },
        ],
      },
      {
        id: "2-2",
        title: "2.2 Subtitles",
        formula: `Subtitles appear at the bottom of the screen with the content "...", synchronized with the audio rhythm.`,
        examples: [
          {
            id: "narrated-landscape-with-subtitles",
            title: "Narrated Landscape with Subtitles",
            subsectionId: "2-2",
            cols: [
              {
                badge: "Output",
                videos: [
                  "https://cdn.vidrushai.com/seedance2-guide/output/output-video-2.mp4",
                ],
                images: [],
              },
              {
                badge: "Reference Input",
                videos: [],
                images: [
                  {
                    src: "https://cdn.vidrushai.com/seedance2-guide/input/input-image-2.webp",
                    alt: "Image 1",
                    caption: "Image 1",
                  },
                ],
              },
            ],
            prompt:
              'Generate a video with voiceover narration. A deep, calm male voice says: "In the grand universe, our world is but a fleeting moment. Yet within it, life thrives against all odds." The scene should slowly transition from night to dawn, with stars gradually fading and the sun rising behind the mountains. Subtitles appear at the bottom of the screen following the narration.',
          },
          {
            id: "office-conversation-with-subtitles",
            title: "Office Conversation with Subtitles",
            subsectionId: "2-2",
            cols: [
              {
                badge: "Output",
                videos: [
                  "https://cdn.vidrushai.com/seedance2-guide/output/output-video-3.mp4",
                ],
                images: [],
              },
              {
                badge: "Reference Input",
                videos: [],
                images: [
                  {
                    src: "https://cdn.vidrushai.com/seedance2-guide/input/input-image-3.webp",
                    alt: "Image 1",
                    caption: "Image 1",
                  },
                ],
              },
            ],
            prompt:
              'The two people in the image are chatting in an office. The woman speaks first, saying: "You always arrive just on time — do you enjoy that feeling of cutting it close?" The man laughs and responds: "I have my own rhythm." The dialogue is casual and natural, with subtitles appearing at the bottom of the screen matching each line.',
          },
        ],
      },
      {
        id: "2-3",
        title: "2.3 Speech Bubbles",
        formula: `[Character] says: "...", speech bubbles appear around the character with the dialogue text.`,
        examples: [
          {
            id: "campus-running-scene-with-bubbles",
            title: "Campus Running Scene with Bubbles",
            subsectionId: "2-3",
            cols: [
              {
                badge: "Output",
                videos: [
                  "https://cdn.vidrushai.com/seedance2-guide/output/output-video-4.mp4",
                ],
                images: [],
              },
              {
                badge: "Reference Input",
                videos: [],
                images: [
                  {
                    src: "https://cdn.vidrushai.com/seedance2-guide/input/input-image-4.webp",
                    alt: "Image 1",
                    caption: "Image 1",
                  },
                ],
              },
            ],
            prompt:
              'The two people from Image 1 are wearing sportswear and running on a school track. The girl looks at the boy and says confidently with a smile: "We can definitely do it!" The camera cuts to a close-up of the boy, who hesitates and replies: "Are you sure?" The camera cuts back to a medium close-up of the girl, who says cheerfully: "Yes!" — her tone is bright and resolute. Speech bubbles appear around each speaking character with the corresponding dialogue.',
          },
          {
            id: "strawberry-farm-scene-with-bubble",
            title: "Strawberry Farm Scene with Bubble",
            subsectionId: "2-3",
            cols: [
              {
                badge: "Output",
                videos: [
                  "https://cdn.vidrushai.com/seedance2-guide/output/output-video-5.mp4",
                ],
                images: [],
              },
              {
                badge: "Reference Input",
                videos: [],
                images: [
                  {
                    src: "https://cdn.vidrushai.com/seedance2-guide/input/input-image-5.webp",
                    alt: "Image 1 & Image 2",
                    caption: "Image 1 & Image 2",
                  },
                ],
              },
            ],
            prompt:
              'Referencing the girl\'s appearance from Image 1 and Image 2, the girl is in a strawberry garden, picks a strawberry, takes a bite, and says with a smile: "This is the real deal!" A speech bubble appears around the girl with the dialogue text.',
          },
        ],
      },
    ],
  },
  {
    id: "image-reference",
    number: "03",
    title: "Image Reference",
    icon: "image",
    intro:
      "Seedance 2.0 supports both multi-angle subject references and multi-image references (scene images, storyboards, etc.). When uploading images in a specific order, use Image 1, Image 2... Image N in your prompt for accurate referencing.",
    subsections: [
      {
        id: "3-1",
        title: "3.1 Multi-angle Subject Reference",
        intro:
          "Simply specify the reference object clearly and the model can respond accordingly. Here are examples for products and characters.",
        formula: `Reference / Extract / Combine + [Image N]'s [Subject], generate [Scene Description], maintaining consistent [Subject] features.`,
        examples: [
          {
            id: "3c-digital-product",
            title: "3C Digital Product",
            subsectionId: "3-1",
            cols: [
              {
                badge: "Output",
                videos: [
                  "https://cdn.vidrushai.com/seedance2-guide/output/output-video-6.mp4",
                ],
                images: [],
              },
              {
                badge: "Reference Input",
                videos: [],
                images: [
                  {
                    src: "https://cdn.vidrushai.com/seedance2-guide/input/input-image-6.webp",
                    alt: "Image 1, 2, 3",
                    caption: "Image 1, 2, 3",
                  },
                ],
              },
            ],
            prompt:
              "Extract the camera from Image 1, Image 2, and Image 3, replace the background with white. The camera sits on a white table, the lens focuses on the camera in close-up, then slowly rotates around the camera as the main subject, clearly showcasing the front, side, and back.",
          },
          {
            id: "household-items",
            title: "Household Items",
            subsectionId: "3-1",
            cols: [
              {
                badge: "Output",
                videos: [
                  "https://cdn.vidrushai.com/seedance2-guide/output/output-video-7.mp4",
                ],
                images: [],
              },
              {
                badge: "Reference Input",
                videos: [],
                images: [
                  {
                    src: "https://cdn.vidrushai.com/seedance2-guide/input/input-image-7.webp",
                    alt: "Reference Images",
                    caption: "Reference Images",
                  },
                ],
              },
            ],
            prompt:
              "The background is a warm-toned home scene. A medium shot shows the thermos bottle from the reference image. The camera smoothly pushes in to a close-up, then a hand naturally enters the frame from off-screen, gently grips the bottle and lifts it. The camera follows as the hand slightly rotates to showcase the product.",
          },
          {
            id: "character-reference",
            title: "Character Reference",
            subsectionId: "3-1",
            cols: [
              {
                badge: "Output",
                videos: [
                  "https://cdn.vidrushai.com/seedance2-guide/output/output-video-8.mp4",
                ],
                images: [],
              },
              {
                badge: "Reference Input",
                videos: [],
                images: [
                  {
                    src: "https://cdn.vidrushai.com/seedance2-guide/input/input-image-8.webp",
                    alt: "Image 1, 2, 3",
                    caption: "Image 1, 2, 3",
                  },
                ],
              },
            ],
            prompt:
              "Reference the woman's appearance from Image 1, Image 2, and Image 3, generate a scene of her eating cake at a coffee shop.",
          },
        ],
      },
      {
        id: "3-2",
        title: "3.2 Multi-image Reference",
        formula: `Reference / Extract / Combine / Follow / Generate + [Image N]'s [Referenced Element Description], generate [Scene Description], maintaining consistent [Referenced Element] features.`,
        examples: [
          {
            id: "logo-reference",
            title: "Logo Reference",
            subsectionId: "3-2",
            cols: [
              {
                badge: "Output",
                videos: [
                  "https://cdn.vidrushai.com/seedance2-guide/output/output-video-9.mp4",
                ],
                images: [],
              },
              {
                badge: "Reference Input",
                videos: [],
                images: [
                  {
                    src: "https://cdn.vidrushai.com/seedance2-guide/input/input-image-9.webp",
                    alt: "Image 1 (Logo) & Image 2 (Character)",
                    caption: "Image 1 (Logo) & Image 2 (Character)",
                  },
                ],
              },
            ],
            prompt:
              "The background is a neon-lit futuristic urban sky corridor with vehicles and holographic ads intertwined. Reference the girl from Image 2, first use a medium shot to show the girl releasing silver floating lanterns with holographic projections, then the camera pulls back to reveal floating lanterns filling the sky. The scene gradually blurs, then the Logo from Image 1 appears. Overall style is 3D cyberpunk sci-fi animation.",
          },
          {
            id: "multi-subject-reference",
            title: "Multi-subject Reference",
            subsectionId: "3-2",
            cols: [
              {
                badge: "Output",
                videos: [
                  "https://cdn.vidrushai.com/seedance2-guide/output/output-video-10.mp4",
                ],
                images: [],
              },
              {
                badge: "Reference Input",
                videos: [],
                images: [
                  {
                    src: "https://cdn.vidrushai.com/seedance2-guide/input/input-image-10.webp",
                    alt: "Cat & Dog Reference Images",
                    caption: "Cat & Dog Reference Images",
                  },
                ],
              },
            ],
            prompt:
              "Reference the cat and dog from the images. In a cozy apartment, the dog is lying down eating dog food. The cat walks over and extends a paw to touch the dog. The dog stops eating when it sees the cat, and the cat snuggles up beside the dog. The scene uses warm color tones.",
          },
          {
            id: "multi-element-reference",
            title: "Multi-element Reference",
            subsectionId: "3-2",
            cols: [
              {
                badge: "Output",
                videos: [
                  "https://cdn.vidrushai.com/seedance2-guide/output/output-video-11.mp4",
                ],
                images: [],
              },
              {
                badge: "Reference Input",
                videos: [],
                images: [
                  {
                    src: "https://cdn.vidrushai.com/seedance2-guide/input/input-image-11.webp",
                    alt: "Image 1-5 (Girl, Outfit, Boy, Restaurant, Logo)",
                    caption: "Image 1-5 (Girl, Outfit, Boy, Restaurant, Logo)",
                  },
                ],
              },
            ],
            prompt:
              "The scene is set inside the restaurant from Image 4, with people coming and going. The girl from Image 1 is wearing the outfit from Image 2, tidying up items on the counter. The boy from Image 3 is a customer who walks up to ask the girl for her contact information. The logo from Image 5 is always displayed in the bottom-right corner of the screen.",
          },
          {
            id: "multi-panel-storyboard",
            title: "Multi-panel Storyboard",
            subsectionId: "3-2",
            cols: [
              {
                badge: "Output",
                videos: [
                  "https://cdn.vidrushai.com/seedance2-guide/output/output-video-12.mp4",
                ],
                images: [],
              },
              {
                badge: "Reference Input",
                videos: [],
                images: [
                  {
                    src: "https://cdn.vidrushai.com/seedance2-guide/input/input-image-12.webp",
                    alt: "Storyboard Image",
                    caption: "Storyboard Image",
                  },
                ],
              },
            ],
            prompt:
              "Reference the storyboard in the image and generate an intense fight scene. Each panel's composition should appear in order, followed by an intense battle between the two characters.",
          },
          {
            id: "storyboard-with-characters",
            title: "Storyboard with Characters",
            subsectionId: "3-2",
            cols: [
              {
                badge: "Output",
                videos: [
                  "https://cdn.vidrushai.com/seedance2-guide/output/output-video-13.mp4",
                ],
                images: [],
              },
              {
                badge: "Reference Input",
                videos: [],
                images: [
                  {
                    src: "https://cdn.vidrushai.com/seedance2-guide/input/input-image-13.webp",
                    alt: "Image 1-4 (Girl, Dad, Storyboard panels)",
                    caption: "Image 1-4 (Girl, Dad, Storyboard panels)",
                  },
                ],
              },
            ],
            prompt:
              'Follow the storyboard composition from Image 3. A girl is waiting for her dad to finish cooking. She says: "Dad, I\'m hungry! Is dinner ready?" The girl\'s appearance references Image 1. Then the camera pans right to switch to Image 4\'s scene and composition. The dad\'s appearance references Image 2. The dad replies: "Almost done, just wait a little!" Then the camera cuts back to a close-up of the daughter looking slightly disappointed, saying: "Still not ready? It smells so good..." Then switch to a close-up of the dad saying: "It\'s almost done for real. Stop rushing and go wash your hands first!"',
          },
        ],
      },
    ],
  },
  {
    id: "video-reference",
    number: "04",
    title: "Video Reference",
    icon: "video",
    intro:
      "Seedance 2.0 supports video referencing. Simply specify the generated content and reference objects clearly. When uploading videos in a specific order, use Video 1, Video 2... Video N in your prompt for accurate referencing.",
    subsections: [
      {
        id: "4-1",
        title: "4.1 Action Reference",
        formula: `Reference [Video N]'s [Action Description], generate [Scene Description], maintaining consistent action details.`,
        examples: [
          {
            id: "film-action-scene",
            title: "Film / Action Scene",
            subsectionId: "4-1",
            cols: [
              {
                badge: "Output",
                videos: [
                  "https://cdn.vidrushai.com/seedance2-guide/output/output-video-14.mp4",
                ],
                images: [],
              },
              {
                badge: "Reference Input",
                videos: [
                  "https://cdn.vidrushai.com/seedance2-guide/input/input-video-14.mp4",
                ],
                images: [
                  {
                    src: "https://cdn.vidrushai.com/seedance2-guide/input/input-image-14.webp",
                    alt: "Image 1 & Image 2 (Characters)",
                    caption: "Image 1 & Image 2 (Characters)",
                  },
                ],
              },
            ],
            prompt:
              "Reference the character actions and camera language from Video 1, generate a fight scene between Image 2 and Image 1. Image 2 is the character on the left, Image 1 is the character on the right. With intense background music.",
          },
          {
            id: "marketing-product-ad",
            title: "Marketing / Product Ad",
            subsectionId: "4-1",
            cols: [
              {
                badge: "Output",
                videos: [
                  "https://cdn.vidrushai.com/seedance2-guide/output/output-video-15.mp4",
                ],
                images: [],
              },
              {
                badge: "Reference Input",
                videos: [
                  "https://cdn.vidrushai.com/seedance2-guide/input/input-video-15.mp4",
                ],
                images: [],
              },
            ],
            prompt:
              "Reference the running form of the horse from Video 1, generate a golden horse galloping on a grassland, then freeze-frame its magnificent running pose, transforming into a horse-shaped gold pendant.",
          },
        ],
      },
      {
        id: "4-2",
        title: "4.2 Camera Movement Reference",
        formula: `Reference [Video N]'s [Camera Movement Description], generate [Scene Description], maintaining consistent camera movement.`,
        examples: [
          {
            id: "tech-park-concept-video",
            title: "Tech Park Concept Video",
            subsectionId: "4-2",
            cols: [
              {
                badge: "Output",
                videos: [
                  "https://cdn.vidrushai.com/seedance2-guide/output/output-video-16.mp4",
                ],
                images: [],
              },
              {
                badge: "Reference Input",
                videos: [
                  "https://cdn.vidrushai.com/seedance2-guide/input/input-video-16.mp4",
                ],
                images: [
                  {
                    src: "https://cdn.vidrushai.com/seedance2-guide/input/input-image-16.webp",
                    alt: "Image 1 (Tech Park)",
                    caption: "Image 1 (Tech Park)",
                  },
                ],
              },
            ],
            prompt:
              "Reference the camera movement from Video 1 to create a concept video for a tech park. Use the high-rise building from Image 1 as the visual center, with the same first-person diving perspective, highlighting the tech aesthetic of the park in Image 1.",
          },
        ],
      },
      {
        id: "4-3",
        title: "4.3 Effects Reference",
        formula: `Reference [Video N]'s [Effects Description], generate [Scene Description], maintaining consistent effects.`,
        examples: [
          {
            id: "film-particle-effects",
            title: "Film / Particle Effects",
            subsectionId: "4-3",
            cols: [
              {
                badge: "Output",
                videos: [
                  "https://cdn.vidrushai.com/seedance2-guide/output/output-video-17.mp4",
                ],
                images: [],
              },
              {
                badge: "Reference Input",
                videos: [
                  "https://cdn.vidrushai.com/seedance2-guide/input/input-video-17.mp4",
                ],
                images: [
                  {
                    src: "https://cdn.vidrushai.com/seedance2-guide/input/input-image-17.webp",
                    alt: "Image 1 (Character)",
                    caption: "Image 1 (Character)",
                  },
                ],
              },
            ],
            prompt:
              "Reference the golden particle effects from Video 1, have the character from Image 2 play a flute while surrounded by the same particle effects.",
          },
          {
            id: "fun-wings-effect",
            title: "Fun / Wings Effect",
            subsectionId: "4-3",
            cols: [
              {
                badge: "Output",
                videos: [
                  "https://cdn.vidrushai.com/seedance2-guide/output/output-video-18.mp4",
                ],
                images: [],
              },
              {
                badge: "Reference Input",
                videos: [
                  "https://cdn.vidrushai.com/seedance2-guide/input/input-video-18.mp4",
                ],
                images: [
                  {
                    src: "https://cdn.vidrushai.com/seedance2-guide/input/input-image-18.webp",
                    alt: "Image 1 (Girl)",
                    caption: "Image 1 (Girl)",
                  },
                ],
              },
            ],
            prompt:
              "Reference the effects from Video 1 to make the girl from Image 1 grow the same wings, with the wing generation trajectory matching exactly.",
          },
        ],
      },
    ],
  },
  {
    id: "video-editing",
    number: "05",
    title: "Video Editing",
    icon: "scissors",
    intro:
      "Seedance 2.0 supports video editing including adding, removing, or modifying elements, extending videos forward or backward, and track completion. When uploading videos in a specific order, use Video 1, Video 2... Video N in your prompt.",
    subsections: [
      {
        id: "5-1",
        title: "5.1 Add / Remove / Modify Elements",
        formula: `Add Element: At [Time Position] + [Spatial Position] of [Video N], add [Desired Element Description].
Remove Element: Remove [Element] from [Video N], keep everything else unchanged.
Modify Element: Replace [Original Element Description] in [Video N] with [Desired Element Description].`,
        examples: [
          {
            id: "add-elements",
            title: "Add Elements",
            subsectionId: "5-1",
            cols: [
              {
                badge: "Output",
                videos: [
                  "https://cdn.vidrushai.com/seedance2-guide/output/output-video-19.mp4",
                ],
                images: [],
              },
              {
                badge: "Reference Input",
                videos: [
                  "https://cdn.vidrushai.com/seedance2-guide/input/input-video-19.mp4",
                ],
                images: [],
              },
            ],
            prompt:
              "Add fried chicken, pizza, and other snacks on the counter in Video 1.",
          },
          {
            id: "remove-elements",
            title: "Remove Elements",
            subsectionId: "5-1",
            cols: [
              {
                badge: "Output",
                videos: [
                  "https://cdn.vidrushai.com/seedance2-guide/output/output-video-20.mp4",
                ],
                images: [],
              },
              {
                badge: "Reference Input",
                videos: [
                  "https://cdn.vidrushai.com/seedance2-guide/input/input-video-20.mp4",
                ],
                images: [],
              },
            ],
            prompt:
              "Clear the other parts and tools from the desktop in Video 1, keep the desktop clean and tidy — only the items they're holding in their hands should remain.",
          },
          {
            id: "modify-elements",
            title: "Modify Elements",
            subsectionId: "5-1",
            cols: [
              {
                badge: "Output",
                videos: [
                  "https://cdn.vidrushai.com/seedance2-guide/output/output-video-21.mp4",
                ],
                images: [],
              },
              {
                badge: "Reference Input",
                videos: [
                  "https://cdn.vidrushai.com/seedance2-guide/input/input-video-21.mp4",
                ],
                images: [
                  {
                    src: "https://cdn.vidrushai.com/seedance2-guide/input/input-image-21.webp",
                    alt: "Image 1 (Face Cream)",
                    caption: "Image 1 (Face Cream)",
                  },
                ],
              },
            ],
            prompt:
              "Replace the perfume in Video 1 with the face cream from Image 1, keeping the motion and camera movement unchanged.",
          },
        ],
      },
      {
        id: "5-2",
        title: "5.2 Video Extension",
        formula:
          "Extend [Video N] forward/backward + [Description of extended content]. Or: Generate content before/after [Video N] + [Description].",
        notes: [
          "The model automatically captures the connecting portion for seamless compositing. Original video segments will not be duplicated.",
        ],
        examples: [
          {
            id: "extend-backward",
            title: "Extend Backward",
            subsectionId: "5-2",
            cols: [
              {
                badge: "Output",
                videos: [
                  "https://cdn.vidrushai.com/seedance2-guide/output/output-video-22.mp4",
                ],
                images: [],
              },
              {
                badge: "Reference Input",
                videos: [
                  "https://cdn.vidrushai.com/seedance2-guide/input/input-video-22.mp4",
                ],
                images: [],
              },
            ],
            prompt:
              "Generate the content after Video 1. Two late-arriving men run toward them, all five people finally meet and chat happily.",
          },
          {
            id: "extend-forward",
            title: "Extend Forward",
            subsectionId: "5-2",
            cols: [
              {
                badge: "Output",
                videos: [
                  "https://cdn.vidrushai.com/seedance2-guide/output/output-video-23.mp4",
                ],
                images: [],
              },
              {
                badge: "Reference Input",
                videos: [
                  "https://cdn.vidrushai.com/seedance2-guide/input/input-video-23.mp4",
                ],
                images: [],
              },
            ],
            prompt:
              "Extend Video 1 forward with an over-the-shoulder shot of the man in white. The man in white says: \"It's not that bad. You're just stressed. Everyone goes through this, you just need to keep going.\"",
          },
        ],
      },
      {
        id: "5-3",
        title: "5.3 Track Completion",
        formula:
          "[Video 1] + [Transition Description] + connect to [Video 2] + [Transition Description] + connect to [Video 3]",
        notes: [
          "Seedance 2.0 supports up to 3 video inputs with a total duration not exceeding 15 seconds. The system automatically captures the connecting portions of the first and last videos, retaining only the necessary segments for compositing.",
        ],
        examples: [
          {
            id: "leaf-transition-between-scenes",
            title: "Leaf Transition Between Scenes",
            subsectionId: "5-3",
            cols: [
              {
                badge: "Output",
                videos: [
                  "https://cdn.vidrushai.com/seedance2-guide/output/output-video-24.mp4",
                ],
                images: [],
              },
              {
                badge: "Reference Input",
                videos: [
                  "https://cdn.vidrushai.com/seedance2-guide/input/input-video-24-1.mp4",
                  "https://cdn.vidrushai.com/seedance2-guide/input/input-video-24-2.mp4",
                ],
                images: [],
              },
            ],
            prompt:
              "Video 1, at the moment the leaf touches the ground, golden particle effects burst out, a gust of wind blows, then connect to Video 2.",
          },
        ],
      },
    ],
  },
];

export const GUIDE_TOC = GUIDE_SECTIONS.map((section) => ({
  id: section.id,
  number: section.number,
  title: section.title,
  icon: section.icon,
  children: section.subsections.map((s) => ({ id: s.id, title: s.title })),
}));

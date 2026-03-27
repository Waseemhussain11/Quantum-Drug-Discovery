# Design System Specification: Quantum Precision

## 1. Overview & Creative North Star

### The Creative North Star: "The Subatomic Observer"
In the realm of quantum drug discovery, we are not just building a dashboard; we are creating a window into the invisible. The Creative North Star for this design system is **"The Subatomic Observer."** It treats the UI as a high-precision optical instrument—highly technical, layered with depth, and pulsating with the energy of molecular simulation.

To break the "standard template" look, we move away from traditional flat panels. This system utilizes **intentional asymmetry** and **overlapping glass layers** to simulate the multidimensional nature of quantum data. We favor high-contrast typography scales and vibrant, "glowing" data markers against a void-like depth to ensure that critical scientific insights feel like they are emerging from the data itself.

---

## 2. Colors & Surface Architecture

The palette is anchored in a deep, nocturnal base to allow the high-energy quantum accents to thrive.

### Tonal Palette
- **Background (`#080e1a`):** The absolute void. All data begins here.
- **Primary Cyan (`#81ecff`):** Used for "Consensus" states and successful data hits.
- **Secondary Purple (`#b884ff`):** Represents "Quantum State" data and complex fusion metrics.
- **Tertiary Emerald (`#b8ffbb`):** Reserved for "Compliant" status and stability indicators.

### The "No-Line" Rule
Traditional 1px solid borders for sectioning are strictly prohibited. Layout boundaries must be defined through:
1. **Background Color Shifts:** Use `surface-container-low` against a `surface` background.
2. **Tonal Transitions:** Defining edges through subtle variations in darkness.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of frosted lenses. Use the tiering system to create depth without clutter:
- **Surface (Deepest):** The main application canvas.
- **Surface-Container-Low:** Use for large structural sidebars or background groupings.
- **Surface-Container-High:** Use for interactive cards or primary data widgets.
- **Surface-Container-Highest:** Reserved for hover states or active pop-overs.

### The "Glass & Gradient" Rule
To evoke a premium, cutting-edge feel, main CTAs and "Hero" cards must utilize **Glassmorphism**.
- **Implementation:** Apply `surface-variant` with a `backdrop-blur` of 12px-20px and a 10% opacity.
- **Visual Soul:** Use a linear gradient (e.g., `primary` to `primary-container`) at a 45-degree angle for primary data visualizations to prevent the UI from feeling static.

---

## 3. Typography

The typography strategy leverages **Inter** for its mathematical precision and exceptional readability at small scales—crucial for scientific datasets.

| Level | Size | Weight | Role |
| :--- | :--- | :--- | :--- |
| **Display-LG** | 3.5rem | Bold | Heroic data discovery titles. |
| **Headline-LG** | 2.0rem | Semi-Bold | Major Section Headers (e.g., "Compound Comparison"). |
| **Title-MD** | 1.125rem | Medium | Sub-module titles and card headers. |
| **Body-MD** | 0.875rem | Regular | Scientific descriptions and methodology text. |
| **Label-SM** | 0.6875rem | Bold | Uppercase labels for micro-data and axis tags. |

**Editorial Note:** Use wide tracking (letter-spacing) on `Label-SM` elements to enhance the "technical instrument" aesthetic.

---

## 4. Elevation & Depth

### The Layering Principle
Hierarchy is achieved through **Tonal Layering**. Instead of shadows, place a `surface-container-lowest` card on a `surface-container-low` section. This creates a "recessed" or "elevated" look that feels integrated into the hardware of the screen.

### Ambient Shadows
When an element must float (e.g., a modal or floating action button):
- **Blur:** 24px - 40px.
- **Opacity:** 4% - 8%.
- **Tint:** Use a shadow color derived from `surface-tint` (`#81ecff`) rather than pure black to simulate the glow of a quantum processor.

### The "Ghost Border" Fallback
If an edge requires definition for accessibility, use a **Ghost Border**:
- **Token:** `outline-variant` (`#424856`).
- **Opacity:** 15% maximum.
- **Width:** 1px.

---

## 5. Components

### Buttons
- **Primary:** Gradient fill (`primary` to `primary-dim`), roundedness `md` (0.375rem). Use a subtle outer glow on hover using the `primary` color.
- **Tertiary (Ghost):** No background. `outline-variant` border at 20% opacity. Text in `on-surface`.

### Data Gauges (Signature Component)
- **Style:** Semi-circular "Hybrid Fusion" gauges. 
- **Stroke:** Use a gradient stroke from `secondary` to `tertiary`. 
- **Backdrop:** The "empty" track should be `surface-bright` at 10% opacity.

### Cards & Lists
- **Rule:** Forbid the use of divider lines. 
- **Separation:** Use `Spacing-8` (2rem) of vertical white space or shift the background from `surface-container-low` to `surface-container-high` to denote a new list item.

### Quantum Progress Bars
- Use a 12px blur "glow" behind the progress indicator.
- The bar should be a gradient of `primary` to `secondary` to represent the "shift" in quantum states during computation.

---

## 6. Do's and Don'ts

### Do
- **DO** use asymmetry. Let a chart bleed off the edge of a container to suggest infinite data.
- **DO** use "Electric Purple" and "Cyan" together in gradients to represent the intersection of biology and quantum physics.
- **DO** prioritize high-density data. This system is for experts; give them the detail they need with `body-sm` and `label-md` tokens.

### Don't
- **DON'T** use 100% white (`#FFFFFF`) for text. Always use `on-surface` (`#e6ebfc`) to reduce eye strain in dark mode.
- **DON'T** use rounded corners larger than `xl` (0.75rem). We want the system to feel "engineered," not "bubbly."
- **DON'T** use standard drop shadows. If it doesn't look like it's emitting light or refracting through glass, it doesn't belong.
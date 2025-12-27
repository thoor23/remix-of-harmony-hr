import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useTheme, ColorTheme, Mode } from "@/contexts/ThemeContext";
import { Check, Sun, Moon, Monitor } from "lucide-react";

interface ThemeOption {
  id: ColorTheme;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

const themes: ThemeOption[] = [
  {
    id: "default",
    name: "Default",
    colors: { primary: "hsl(160 84% 39%)", secondary: "hsl(160 20% 96%)", accent: "hsl(160 30% 94%)" },
  },
  {
    id: "glacier",
    name: "Glacier",
    colors: { primary: "hsl(210 80% 50%)", secondary: "hsl(210 30% 96%)", accent: "hsl(210 40% 94%)" },
  },
  {
    id: "harvest",
    name: "Harvest",
    colors: { primary: "hsl(30 90% 50%)", secondary: "hsl(30 30% 96%)", accent: "hsl(30 40% 94%)" },
  },
  {
    id: "lavender",
    name: "Lavender",
    colors: { primary: "hsl(270 70% 55%)", secondary: "hsl(270 30% 96%)", accent: "hsl(270 40% 94%)" },
  },
  {
    id: "brutalist",
    name: "Brutalist",
    colors: { primary: "hsl(0 0% 15%)", secondary: "hsl(0 0% 96%)", accent: "hsl(0 0% 92%)" },
  },
  {
    id: "obsidian",
    name: "Obsidian",
    colors: { primary: "hsl(240 5% 30%)", secondary: "hsl(240 5% 96%)", accent: "hsl(240 5% 92%)" },
  },
  {
    id: "orchid",
    name: "Orchid",
    colors: { primary: "hsl(330 75% 55%)", secondary: "hsl(330 30% 96%)", accent: "hsl(330 40% 94%)" },
  },
  {
    id: "solar",
    name: "Solar",
    colors: { primary: "hsl(45 95% 50%)", secondary: "hsl(45 40% 96%)", accent: "hsl(45 50% 92%)" },
  },
  {
    id: "tide",
    name: "Tide",
    colors: { primary: "hsl(185 80% 40%)", secondary: "hsl(185 30% 96%)", accent: "hsl(185 40% 94%)" },
  },
  {
    id: "verdant",
    name: "Verdant",
    colors: { primary: "hsl(140 60% 35%)", secondary: "hsl(140 25% 96%)", accent: "hsl(140 35% 94%)" },
  },
];

const modeOptions: { id: Mode; name: string; icon: React.ElementType }[] = [
  { id: "light", name: "Light", icon: Sun },
  { id: "dark", name: "Dark", icon: Moon },
  { id: "system", name: "System", icon: Monitor },
];

export default function AppearancePage() {
  const { colorTheme, mode, setColorTheme, setMode } = useTheme();

  return (
    <PageContainer>
      <PageHeader
        title="Appearance"
        description="Customize the look and feel of your application"
      />

      <div className="grid gap-6">
        {/* Mode Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Mode</CardTitle>
            <CardDescription>Choose between light, dark, or system mode</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {modeOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setMode(option.id)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all hover:bg-muted/50",
                    mode === option.id
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  )}
                >
                  <option.icon className={cn(
                    "h-6 w-6",
                    mode === option.id ? "text-primary" : "text-muted-foreground"
                  )} />
                  <span className={cn(
                    "text-sm font-medium",
                    mode === option.id ? "text-primary" : "text-foreground"
                  )}>
                    {option.name}
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Color Theme Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Color Theme</CardTitle>
            <CardDescription>Select a color theme for your dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setColorTheme(theme.id)}
                  className={cn(
                    "relative flex flex-col gap-2 p-3 rounded-lg border-2 transition-all hover:scale-105",
                    colorTheme === theme.id
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-border hover:border-muted-foreground/30"
                  )}
                >
                  {colorTheme === theme.id && (
                    <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                  
                  {/* Color Preview */}
                  <div className="flex gap-1.5 p-2 rounded-md bg-muted/30">
                    <div
                      className="h-8 w-8 rounded-md shadow-sm"
                      style={{ backgroundColor: theme.colors.primary }}
                    />
                    <div
                      className="h-8 w-4 rounded-md shadow-sm border"
                      style={{ backgroundColor: theme.colors.secondary }}
                    />
                    <div
                      className="h-8 w-4 rounded-md shadow-sm border"
                      style={{ backgroundColor: theme.colors.accent }}
                    />
                  </div>
                  
                  <Label className="text-center text-sm font-medium cursor-pointer">
                    {theme.name}
                  </Label>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
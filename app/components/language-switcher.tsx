import { useLanguage } from "./language-provider";
import { NeoButton } from "~/components/ui/neo-button";

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="flex items-center gap-2">
      <NeoButton
        variant={language === "fr" ? "default" : "outline"}
        neoVariant="sm"
        size="sm"
        onClick={() => setLanguage("fr")}
        className="font-bold"
      >
        FR
      </NeoButton>
      <NeoButton
        variant={language === "en" ? "default" : "outline"}
        neoVariant="sm"
        size="sm"
        onClick={() => setLanguage("en")}
        className="font-bold"
      >
        EN
      </NeoButton>
    </div>
  );
}

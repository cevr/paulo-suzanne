import { Form } from "react-router";
import { useLanguage } from "../lib/language-provider";
import { NeoButton } from "~/components/ui/neo-button";

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <Form action="/lang" method="post" navigate={false}>
      <div className="flex items-center gap-2">
        <NeoButton
          variant={language === "fr" ? "default" : "outline"}
          neoVariant="sm"
          size="sm"
          onClick={() => setLanguage("fr")}
          className="font-bold"
          name="lang"
          value="fr"
        >
          FR
        </NeoButton>
        <NeoButton
          variant={language === "en" ? "default" : "outline"}
          neoVariant="yellowSm"
          size="sm"
          onClick={() => setLanguage("en")}
          className="font-bold"
          name="lang"
          value="en"
        >
          EN
        </NeoButton>
      </div>
    </Form>
  );
}

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { EmojiMartData } from "@emoji-mart/data";
import emojiMartData from "@emoji-mart/data/sets/15/native.json";
import { Smile } from "lucide-react";

type EmojiPanelProps = {
  onEmojiSelect: (emoji: string) => void;
  customTrigger?: React.ReactNode;
  triggerTooltip?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const categoryEmojiById: Record<string, string> = {
  people: "😀",
  nature: "🐶",
  foods: "🍔",
  activity: "🎉",
  places: "✈️",
  objects: "💡",
  symbols: "🔥",
  flags: "🏳️",
};

const categoryOrder = [
  "people",
  "nature",
  "foods",
  "activity",
  "places",
  "objects",
  "symbols",
  "flags",
] as const;

const categoryToTranslationKey: Record<string, string> = {
  people: "smileys",
  nature: "animals",
  foods: "food",
  activity: "activities",
  places: "travel",
  objects: "objects",
  symbols: "symbols",
  flags: "flags",
};

const emojiData = emojiMartData as EmojiMartData;

export default function EmojiPanel({
  onEmojiSelect,
  customTrigger,
  triggerTooltip,
  open,
  onOpenChange,
}: EmojiPanelProps) {
  const { t } = useTranslation();
  const [internalOpen, setInternalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState<
    (typeof categoryOrder)[number]
  >((categoryOrder[0] ?? "people") as (typeof categoryOrder)[number]);

  const emojiCategories = categoryOrder
    .map((categoryId) => {
      const category = emojiData.categories.find(({ id }) => id === categoryId);
      if (!category) return null;

      const translationKey = categoryToTranslationKey[categoryId];
      const emojis = category.emojis
        .map((emojiId) => ({
          id: emojiId,
          emoji:
            emojiData.emojis[emojiId]?.skins?.[0]?.native ??
            emojiData.emojis[emojiId]?.skins?.[0]?.unified ??
            emojiId,
          name: emojiData.emojis[emojiId]?.name ?? emojiId,
          keywords: emojiData.emojis[emojiId]?.keywords ?? [],
          emoticons: emojiData.emojis[emojiId]?.emoticons ?? [],
        }))
        .filter((emoji) => emoji.emoji);

      return {
        id: category.id,
        categoryId,
        name: t(`emoji.categories.${translationKey}`),
        icon: categoryEmojiById[categoryId] ?? "🙂",
        emojis,
      };
    })
    .filter(
      (category): category is NonNullable<typeof category> => category !== null,
    );

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const isSearching = normalizedQuery.length > 0;

  const filteredEmojis = isSearching
    ? emojiCategories.flatMap((category) =>
        category.emojis
          .filter((emoji) => {
            const haystack = [
              emoji.id,
              emoji.name,
              emoji.emoji,
              ...emoji.keywords,
              ...emoji.emoticons,
            ]
              .join(" ")
              .toLowerCase();

            return haystack.includes(normalizedQuery);
          })
          .map((emoji) => ({
            categoryName: category.name,
            emoji: emoji.emoji,
          })),
      )
    : [];

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji);
    if (open === undefined) {
      setInternalOpen(false);
    }
    onOpenChange?.(false);
  };

  const isOpen = open ?? internalOpen;

  const handleOpenChange = (nextOpen: boolean) => {
    if (open === undefined) {
      setInternalOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      {triggerTooltip ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              {customTrigger || (
                <Button
                  type="button"
                  variant="outline"
                  className="shrink-0 cursor-pointer"
                >
                  <Smile className="size-4" />
                </Button>
              )}
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>{triggerTooltip}</p>
          </TooltipContent>
        </Tooltip>
      ) : (
        <PopoverTrigger asChild>
          {customTrigger || (
            <Button
              type="button"
              variant="outline"
              className="shrink-0 cursor-pointer"
            >
              <Smile className="size-4" />
            </Button>
          )}
        </PopoverTrigger>
      )}

      <PopoverContent className="w-80 p-0" align="center">
        <PopoverHeader className="border-b px-4 py-3">
          <PopoverTitle>{t("emoji.panel.title")}</PopoverTitle>
          <div className="mt-3">
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={t("emoji.panel.search_placeholder")}
              aria-label={t("emoji.panel.search_placeholder")}
              className="h-9"
            />
          </div>
        </PopoverHeader>

        {isSearching ? (
          <div className="max-h-72 overflow-y-auto p-4">
            {filteredEmojis.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                {t("emoji.panel.no_results")}
              </div>
            ) : (
              <div className="grid grid-cols-5 gap-2">
                {filteredEmojis.map(({ categoryName, emoji }) => (
                  <Button
                    key={`${categoryName}-${emoji}`}
                    type="button"
                    variant="ghost"
                    className="h-10 w-10 p-0 text-lg cursor-pointer"
                    onClick={() => handleEmojiClick(emoji)}
                    aria-label={t("emoji.panel.insert", { emoji })}
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <Tabs
            value={activeCategoryId}
            onValueChange={(value) =>
              setActiveCategoryId(value as (typeof categoryOrder)[number])
            }
            className="w-full gap-0"
          >
            <TabsList className="h-auto w-full flex-wrap justify-start gap-1 rounded-none border-b bg-transparent p-2">
              {emojiCategories.map((category) => (
                <TabsTrigger
                  key={category.categoryId}
                  value={category.categoryId}
                  className="h-10 w-10 flex-none rounded-md px-0 text-lg cursor-pointer"
                  aria-label={category.name}
                  title={category.name}
                >
                  <span aria-hidden="true">{category.icon}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="max-h-48 overflow-y-auto p-4">
              {emojiCategories
                .filter((category) => category.categoryId === activeCategoryId)
                .map((category) => (
                  <TabsContent
                    key={category.categoryId}
                    value={category.categoryId}
                    className="mt-0"
                  >
                    <div className="grid grid-cols-5 gap-2">
                      {category.emojis.map((emoji) => (
                        <Button
                          key={`${category.categoryId}-${emoji.id}`}
                          type="button"
                          variant="ghost"
                          className="h-10 w-10 p-0 text-lg cursor-pointer"
                          onClick={() => handleEmojiClick(emoji.emoji)}
                          aria-label={t("emoji.panel.insert", {
                            emoji: emoji.emoji,
                          })}
                        >
                          {emoji.emoji}
                        </Button>
                      ))}
                    </div>
                  </TabsContent>
                ))}
            </div>
          </Tabs>
        )}
      </PopoverContent>
    </Popover>
  );
}

import {
  useCallback,
  useMemo,
  useState,
  type KeyboardEvent,
  type RefObject,
} from "react";
import clsx from "clsx";
import { IconPlus } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useComputedColorScheme } from "@mantine/core";
import { ILabel } from "@/features/label/types/label.types.ts";
import { useWorkspaceLabelsQuery } from "@/features/label/queries/label-query.ts";
import { getLabelColor } from "@/features/label/utils/label-colors.ts";
import { normalizeLabelName } from "@/features/label/utils/normalize-label.ts";
import classes from "@/features/label/label.module.css";

type LabelPickerProps = {
  canCreate: boolean;
  hover: number;
  normalized: string;
  queryIsApplied: boolean;
  queryIsInvalid: boolean;
  suggestions: ILabel[];
  onHoverChange: (index: number) => void;
  onSelect: (index: number) => void;
};

type UseLabelPickerArgs = {
  applied: ILabel[];
  enabled: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  onAdd: (name: string) => void;
  onClose: () => void;
};

const NAME_PATTERN = /^[a-z0-9_-][a-z0-9_~-]*$/;
export const MAX_LABEL_NAME_LENGTH = 100;

function isValidLabelName(name: string): boolean {
  return (
    name.length > 0 &&
    name.length <= MAX_LABEL_NAME_LENGTH &&
    NAME_PATTERN.test(name)
  );
}

export function useLabelPicker({
  applied,
  enabled,
  inputRef,
  onAdd,
  onClose,
}: UseLabelPickerArgs) {
  const [query, setQueryState] = useState("");
  const [hover, setHover] = useState(0);

  const normalized = normalizeLabelName(query);
  const { data } = useWorkspaceLabelsQuery(normalized, enabled);

  const appliedNames = useMemo(
    () => new Set(applied.map((l) => l.name.toLowerCase())),
    [applied],
  );

  const suggestions = useMemo(() => {
    const items = data?.items ?? [];
    return items.filter((l) => !appliedNames.has(l.name.toLowerCase()));
  }, [data, appliedNames]);

  const exact = suggestions.find((l) => l.name === normalized);
  const queryIsApplied = appliedNames.has(normalized);
  const queryIsInvalid = normalized.length > 0 && !isValidLabelName(normalized);
  const canCreate = !exact && !queryIsApplied && isValidLabelName(normalized);
  const total = suggestions.length + (canCreate ? 1 : 0);

  const reset = useCallback(() => {
    setQueryState("");
    setHover(0);
  }, []);

  const close = useCallback(() => {
    reset();
    onClose();
  }, [onClose, reset]);

  const setQuery = useCallback((value: string) => {
    setQueryState(value);
    setHover(0);
  }, []);

  const select = useCallback(
    (idx: number) => {
      let selectedName: string | undefined;

      if (idx < suggestions.length) {
        selectedName = suggestions[idx].name;
      } else if (idx === suggestions.length && canCreate) {
        selectedName = normalized;
      }

      if (!selectedName) {
        return;
      }

      onAdd(selectedName);
      reset();
      inputRef.current?.focus({ preventScroll: true });
    },
    [canCreate, inputRef, normalized, onAdd, reset, suggestions],
  );

  const onInputKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHover((h) => Math.min(Math.max(total - 1, 0), h + 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHover((h) => Math.max(0, h - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (total === 0) return;
        select(hover);
      } else if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    },
    [close, hover, select, total],
  );

  return {
    canCreate,
    close,
    hover,
    normalized,
    onInputKeyDown,
    query,
    queryIsApplied,
    queryIsInvalid,
    reset,
    select,
    setHover,
    setQuery,
    suggestions,
  };
}

export function LabelPicker({
  canCreate,
  hover,
  normalized,
  queryIsApplied,
  queryIsInvalid,
  suggestions,
  onHoverChange,
  onSelect,
}: LabelPickerProps) {
  const { t } = useTranslation();
  const scheme = useComputedColorScheme("light");
  const total = suggestions.length + (canCreate ? 1 : 0);

  return (
    <div className={classes.popover}>
      <div className={classes.popoverList}>
        {total === 0 && (
          <div className={classes.popoverEmpty}>
            {normalized.length === 0
              ? t("No labels yet")
              : queryIsApplied
                ? t("Already added")
                : queryIsInvalid
                  ? t("Invalid label name")
                  : t("No matches")}
          </div>
        )}
        {suggestions.map((s, i) => {
          const c = getLabelColor(s.name, scheme);
          return (
            <button
              key={s.id}
              type="button"
              className={clsx(
                classes.popoverItem,
                hover === i && classes.popoverItemHover,
              )}
              onMouseEnter={() => onHoverChange(i)}
              onClick={() => onSelect(i)}
            >
              <span
                className={classes.popoverItemDot}
                style={{ background: c.dot }}
              />
              <span className={classes.popoverItemName}>{s.name}</span>
            </button>
          );
        })}
        {canCreate && (
          <button
            type="button"
            className={clsx(
              classes.popoverItem,
              hover === suggestions.length && classes.popoverItemHover,
            )}
            onMouseEnter={() => onHoverChange(suggestions.length)}
            onClick={() => onSelect(suggestions.length)}
          >
            <span className={classes.popoverCreatePlus}>
              <IconPlus size={12} stroke={2} />
            </span>
            <span className={classes.popoverItemName}>
              {t("Create")} <b>"{normalized}"</b>
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

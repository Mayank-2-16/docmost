import { useRef, useState } from "react";
import clsx from "clsx";
import { Divider, Popover, Stack, Text } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { LabelChip } from "@/features/label/components/label-chip.tsx";
import {
  LabelPicker,
  MAX_LABEL_NAME_LENGTH,
  useLabelPicker,
} from "@/features/label/components/label-picker.tsx";
import {
  useAddLabelsMutation,
  usePageLabelsQuery,
  useRemoveLabelMutation,
} from "@/features/label/queries/label-query.ts";
import classes from "@/features/label/label.module.css";

type LabelsSectionProps = {
  pageId: string;
  canEdit: boolean;
};

export function LabelsSection({ pageId, canEdit }: LabelsSectionProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data } = usePageLabelsQuery(pageId);
  const addMutation = useAddLabelsMutation(pageId);
  const removeMutation = useRemoveLabelMutation(pageId);

  const labels = data?.items ?? [];

  const handleAdd = (name: string) => {
    addMutation.mutate({ pageId, names: [name] });
  };

  const handleRemove = (labelId: string) => {
    removeMutation.mutate({ pageId, labelId });
  };

  const closePicker = () => {
    setOpen(false);
    inputRef.current?.blur();
  };

  const picker = useLabelPicker({
    applied: labels,
    enabled: open,
    inputRef,
    onAdd: handleAdd,
    onClose: closePicker,
  });

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setOpen(true);
    } else {
      picker.close();
    }
  };

  if (!canEdit && labels.length === 0) {
    return null;
  }

  return (
    <>
      <Divider />
      <Stack gap="xs">
        <Text size="xs" fw={500} c="dimmed">
          {t("Labels")}
        </Text>
        <div className={classes.labelsWrap}>
          {labels.map((label) => (
            <LabelChip
              key={label.id}
              label={label}
              asLink
              onRemove={canEdit ? () => handleRemove(label.id) : undefined}
            />
          ))}
          {canEdit && (
            <Popover
              opened={open}
              onChange={handleOpenChange}
              position="bottom-end"
              shadow="lg"
              hideDetached={false}
              trapFocus={false}
              withinPortal
              offset={6}
            >
              <Popover.Target>
                <label
                  className={clsx(
                    classes.addInputTarget,
                    open && classes.addInputTargetOpen,
                  )}
                >
                  <IconPlus
                    size={12}
                    stroke={2}
                    className={classes.addInputIcon}
                  />
                  <input
                    ref={inputRef}
                    type="text"
                    role="combobox"
                    aria-label={t("Add label")}
                    aria-expanded={open}
                    aria-autocomplete="list"
                    maxLength={MAX_LABEL_NAME_LENGTH}
                    placeholder={
                      labels.length === 0 ? t("Add label") : t("Add")
                    }
                    value={picker.query}
                    onFocus={() => setOpen(true)}
                    onClick={() => setOpen(true)}
                    onChange={(e) => {
                      picker.setQuery(e.currentTarget.value);
                      setOpen(true);
                    }}
                    onKeyDown={picker.onInputKeyDown}
                  />
                </label>
              </Popover.Target>
              <Popover.Dropdown p={0} className={classes.popover}>
                <LabelPicker
                  canCreate={picker.canCreate}
                  hover={picker.hover}
                  normalized={picker.normalized}
                  queryIsApplied={picker.queryIsApplied}
                  queryIsInvalid={picker.queryIsInvalid}
                  suggestions={picker.suggestions}
                  onHoverChange={picker.setHover}
                  onSelect={picker.select}
                />
              </Popover.Dropdown>
            </Popover>
          )}
        </div>
      </Stack>
    </>
  );
}

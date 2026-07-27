# Camp Moshava eMAR Enhanced Toolbar

A Tampermonkey userscript that adds a sticky toolbar to the CampMinder eMAR page, giving Health Center nurses faster control over filtering and date navigation without touching the native filter panel.

---

## Features

### Hide Administered
Hides medications that have already been administered or skipped. When active, collapses person cards and meal sections that have no remaining medications to show. Displays a live count of hidden rows in the button label. State persists across sessions.

### Hide Unaccepted
Hides medications marked as pending (shown with an orange "(pending)" label in CampMinder). Works independently of Hide Administered -- both toggles can be active at the same time. A person card collapses only when all of their medications are hidden by one or both active toggles. State persists across sessions.

### Today Button
Resets the date field to today and triggers a CampMinder data refresh, identical to picking today's date from the calendar. Appears hollow (green border) when the current date is not today, and filled green when it is.

### Delivery Time Pills
Quick-select buttons for Breakfast, Lunch, Dinner, Bedtime, As Needed, Other, All, and Custom.

- Clicking a named pill selects exactly that one native delivery time checkbox and unchecks the rest.
- **All** checks every visible delivery time checkbox at once.
- **Custom** (amber, dashed border) lights up automatically when the native filter has a mixed or multi-item selection that doesn't match any single named pill. It is read-only -- the nurse adjusts the native checkboxes directly to reach a custom state.
- Pills stay in sync with the native filter checkboxes, so changes made in the native panel are reflected immediately.

---

## Toolbar Layout

```
[ Hide administered ]  [ Hide unaccepted ]  [ Today ]  |  TIME:  [ Breakfast ] [ Lunch ] [ Dinner ] [ Bedtime ] [ As Needed ] [ Other ] [ All ] [ Custom ]
```

---

## Installation

1. Install the [Tampermonkey](https://www.tampermonkey.net/) extension for Chrome.
2. Open the Tampermonkey dashboard and create a new script.
3. Delete the default content, paste the full contents of `camp-moshava-emar.user.js`, and save.
4. Navigate to `https://system.campminder.com` and open the eMAR page. The toolbar should appear above the medication list.

For updating an existing installation, see `emar-script-update-guide.docx`.

---

## Files

| File | Description |
|---|---|
| `camp-moshava-emar.user.js` | The Tampermonkey userscript |
| `emar-script-update-guide.docx` | Step-by-step Word document for nurses updating the script |

---

## Technical Notes

**Target page:** `https://system.campminder.com/*`

**Grants:** `GM_getValue`, `GM_setValue`, `unsafeWindow`

**SPA compatibility:** CampMinder re-renders the results area (`#divEMARBodyResults`) on every filter or date change. The script uses a persistent 500ms boot poll to detect when the toolbar has been removed and remount it. A MutationObserver watches the results area and debounces DOM changes to keep hide state current.

**jQuery isolation:** Tampermonkey's sandbox can produce an isolated jQuery instance whose internal data store does not contain CampMinder's datepicker registration. `unsafeWindow.jQuery` is used explicitly to access the page's actual jQuery so the Today button can call the datepicker's `onSelect` callback and trigger a data refresh.

**CSS specificity:** All toolbar styles use `#moshava-toolbar` as a parent selector with `!important` on key properties to override CampMinder's global button resets.

**Pending detection:** A medication is considered unaccepted when its `.eMARMedicationLabel` contains a `<span>` whose text is exactly `(pending)`.

**Administered detection:** A medication is considered administered when its `.eMARAdministered` element has a computed `display` value other than `none`.

---

## Version History

| Version | Notes |
|---|---|
| 2.1 | Added Hide unaccepted toggle. Renamed "Hide completed" to "Hide administered". Renamed "Hide unapproved" to "Hide unaccepted". Both toggles cooperate on person/meal collapse logic. |
| 2.0 | Added delivery time pills, All pill, Custom pill, Today button, persistent boot poll, MutationObserver, `unsafeWindow.jQuery` fix for Today button refresh. |
| 1.0 | Initial release: Hide completed toggle only. |

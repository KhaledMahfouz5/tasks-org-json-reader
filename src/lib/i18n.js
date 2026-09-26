export const translations = {
  en: {
    appName: 'Tasks.org Backup Viewer',
    welcome: 'Welcome back',
    dataLoaded: 'Backup loaded',
    import: 'Import',
    export: 'Export',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    close: 'Close',
    restore: 'Restore',
    sync: 'Sync',
    settings: 'Settings',
    search: 'Search tasks',
    searchPlaceholder: 'Search…',
    noResults: 'No tasks match your search',
    syncFolder: 'Sync folder',
    folderPath: 'Folder path',
    browse: 'Browse…',
    autoSave: 'Auto-save to file',
    autoSaveDesc: 'Write every edit straight back to the backup file.',
    saved: 'Saved',
    autoSaveFailed: 'Auto-save failed: {error}',
    syncStatus: 'Syncing to {name}',
    syncNotSet: 'No sync folder set',
    autoSaveUnsupported:
      'Auto-save to a folder needs Chrome/Edge on desktop. Use Export to save changes.',
    filters: 'Filters',
    all: 'All',
    important: 'Important',
    today: 'Today',
    overdue: 'Overdue',
    completed: 'Completed',
    trash: 'Trash',
    lists: 'Lists',
    tags: 'Tags',
    untitled: 'Untitled',
    noTasks: 'No tasks here',
    noTasksHint: 'Tap + to add one.',
    addTask: 'Add task',
    editTask: 'Edit task',
    taskTitle: 'Title',
    taskNotes: 'Notes',
    dueDate: 'Due date',
    clearDue: 'Clear',
    priority: 'Priority',
    list: 'List',
    status: 'Status',
    done: 'Done',
    open: 'Open',
    recurrence: 'Recurrence (RRULE)',
    recurrencePreview: 'Preview: {summary}',
    addTag: 'Add tag',
    tagPlaceholder: 'Tag name (Enter to add)',
    noTags: 'No tags',
    readOnlyNotice: 'This task is read-only and cannot be modified.',
    relations: 'Parent & subtasks',
    parentTask: 'Parent: {title}',
    parent: 'Parent',
    subtasks: 'Subtasks',
    subtaskCount: '{count} subtask',
    subtaskCountPlural: '{count} subtasks',
    due: {
      overdue: 'Overdue',
      today: 'Today',
      tomorrow: 'Tomorrow',
      none: 'No due date'
    },
    importance: {
      high: 'High',
      medium: 'Medium',
      low: 'Low',
      none: 'None'
    },
    recur: {
      every: 'Every',
      day: 'day',
      days: 'days',
      week: 'week',
      weeks: 'weeks',
      month: 'month',
      months: 'months',
      year: 'year',
      years: 'years'
    },
    group: {
      overdue: 'Overdue',
      today: 'Today',
      upcoming: 'Upcoming',
      someday: 'Someday',
      completed: 'Completed',
      trash: 'Trash'
    },
    importCta: 'Drop JSON backup here or click to browse',
    importProgress: 'Importing…',
    importSuccess: 'Backup imported — {count} tasks',
    exportSuccess: 'Backup exported',
    exportDownload: 'Backup downloaded',
    exportFailed: 'Export failed: {error}',
    invalidJson: 'Invalid backup file: {error}',
    emptyStateTitle: 'Your tasks, at your desk',
    emptyStateText: 'Import a Tasks.org backup to view, edit and export your tasks.',
    emptyStateCta: 'Choose a backup file',
    privacy: 'Runs 100% in your browser — no data leaves your device.',
    fileReadError: 'Could not read that file.',
    confirmDeleteTitle: 'Delete task?',
    confirmDeleteMsg: 'This moves it to Trash. You can restore it later.',
    deleteSuccess: 'Task moved to Trash',
    restoreSuccess: 'Task restored',
    syncTitle: 'Syncthing workflow',
    syncStep1:
      '1 · On your phone: Tasks.org → Settings → Backups → Export tasks. The file lands in your Syncthing folder.',
    syncStep2:
      '2 · On this PC: open the same Syncthing folder, import the backup, then set the folder here.',
    syncStep3:
      '3 · Enable auto-save: every edit writes back to that file, and your phone imports it on the next sync.',
    syncPathHint:
      'Pick your Syncthing folder with Browse. Chrome/Edge on desktop can write files in place; other browsers can choose the folder (for reference) and save via Export.',
    folderPicked: 'Folder selected: {name}',
    tasks: '{count} tasks',
    footer: 'Tasks.org Backup Viewer — offline-first',
    openTasksOrg: 'Visit tasks.org',
    savedPin: 'All changes saved locally. Use Export to write a file.',
    kbdImport: 'Ctrl/Cmd+O — import',
    kbdSave: 'Ctrl/Cmd+S — save',
    aria: {
      menu: 'Toggle sidebar',
      theme: 'Toggle theme',
      lang: 'Switch language',
      close: 'Close',
      edit: 'Edit task',
      delete: 'Delete task',
      collapse: 'Collapse subtasks',
      expand: 'Expand subtasks',
      saveToFile: 'Save backup to file'
    }
  },

  ar: {
    appName: 'عارض نسخ Tasks.org',
    welcome: 'مرحبًا بعودتك',
    dataLoaded: 'تم تحميل النسخة الاحتياطية',
    import: 'استيراد',
    export: 'تصدير',
    save: 'حفظ',
    cancel: 'إلغاء',
    delete: 'حذف',
    close: 'إغلاق',
    restore: 'استعادة',
    sync: 'مزامنة',
    settings: 'الإعدادات',
    search: 'ابحث في المهام',
    searchPlaceholder: 'بحث…',
    noResults: 'لا توجد مهام تطابق بحثك',
    syncFolder: 'مجلد المزامنة',
    folderPath: 'مسار المجلد',
    browse: 'استعراض…',
    autoSave: 'الحفظ التلقائي إلى ملف',
    autoSaveDesc: 'اكتب كل تعديل مباشرة إلى ملف النسخة.',
    saved: 'تم الحفظ',
    autoSaveFailed: 'فشل الحفظ التلقائي: {error}',
    syncStatus: 'المزامنة إلى {name}',
    syncNotSet: 'لم يُحدَّد مجلد مزامنة',
    autoSaveUnsupported:
      'الحفظ التلقائي إلى مجلد يتطلب كروم/إيدج على المكتب. استخدم «تصدير» لحفظ التغييرات.',
    filters: 'الفلاتر',
    all: 'الكل',
    important: 'مهمة',
    today: 'اليوم',
    overdue: 'متأخرة',
    completed: 'مكتملة',
    trash: 'سلة المهملات',
    lists: 'القوائم',
    tags: 'الوسوم',
    untitled: 'بدون عنوان',
    noTasks: 'لا توجد مهام هنا',
    noTasksHint: 'اضغط + لإضافة مهمة.',
    addTask: 'إضافة مهمة',
    editTask: 'تعديل المهمة',
    taskTitle: 'العنوان',
    taskNotes: 'ملاحظات',
    dueDate: 'تاريخ الاستحقاق',
    clearDue: 'مسح',
    priority: 'الأولوية',
    list: 'القائمة',
    status: 'الحالة',
    done: 'مكتملة',
    open: 'مفتوحة',
    recurrence: 'التكرار (RRULE)',
    recurrencePreview: 'معاينة: {summary}',
    addTag: 'إضافة وسم',
    tagPlaceholder: 'اسم الوسم (Enter للإضافة)',
    noTags: 'بدون وسوم',
    readOnlyNotice: 'هذه المهمة للقراءة فقط ولا يمكن تعديلها.',
    relations: 'المهمة الأم والمهام الفرعية',
    parentTask: 'المهمة الأم: {title}',
    parent: 'المهمة الأم',
    subtasks: 'المهام الفرعية',
    subtaskCount: 'مهمة فرعية واحدة',
    subtaskCountPlural: '{count} مهمة فرعية',
    due: {
      overdue: 'متأخرة',
      today: 'اليوم',
      tomorrow: 'غدًا',
      none: 'بدون تاريخ استحقاق'
    },
    importance: {
      high: 'عالية',
      medium: 'متوسطة',
      low: 'منخفضة',
      none: 'بدون'
    },
    recur: {
      every: 'كل',
      day: 'يوم',
      days: 'أيام',
      week: 'أسبوع',
      weeks: 'أسابيع',
      month: 'شهر',
      months: 'أشهر',
      year: 'سنة',
      years: 'سنوات'
    },
    group: {
      overdue: 'متأخرة',
      today: 'اليوم',
      upcoming: 'قادمة',
      someday: 'غير مجدولة',
      completed: 'مكتملة',
      trash: 'سلة المهملات'
    },
    importCta: 'أفلت ملف النسخة الاحتياطية هنا أو انقر للاستعراض',
    importProgress: 'جارٍ الاستيراد…',
    importSuccess: 'تم استيراد النسخة — {count} مهمة',
    exportSuccess: 'تم تصدير النسخة',
    exportDownload: 'تم تنزيل النسخة',
    exportFailed: 'فشل التصدير: {error}',
    invalidJson: 'ملف غير صالح: {error}',
    emptyStateTitle: 'مهامك على مكتبك',
    emptyStateText: 'استورد نسخة Tasks.org الاحتياطية لعرض مهامك وتعديلها وتصديرها.',
    emptyStateCta: 'اختر ملف نسخة',
    privacy: 'يعمل بالكامل داخل متصفحك — لا تغادر بياناتك جهازك أبدًا.',
    fileReadError: 'تعذّرت قراءة هذا الملف.',
    confirmDeleteTitle: 'حذف المهمة؟',
    confirmDeleteMsg: 'سينتقل هذا إلى سلة المهملات ويمكنك استعادته لاحقًا.',
    deleteSuccess: 'نُقلت المهمة إلى سلة المهملات',
    restoreSuccess: 'تمت استعادة المهمة',
    syncTitle: 'سير عمل المزامنة (Syncthing)',
    syncStep1:
      '١ · على هاتفك: Tasks.org ← الإعدادات ← النسخ الاحتياطي ← تصدير المهام. سيُحفظ الملف في مجلد المزامنة.',
    syncStep2:
      '٢ · على هذا الكمبيوتر: افتح مجلد المزامنة نفسه، استورد النسخة، ثم اضبط المجلد هنا.',
    syncStep3:
      '٣ · فعِّل الحفظ التلقائي: كل تعديل يُكتب في الملف، ويستورده هاتفك عند المزامنة التالية.',
    syncPathHint:
      'اختر مجلد المزامنة بزر «استعراض». يمكن لمتصفحي كروم/إيدج على المكتب الكتابة في الملف مباشرة؛ والمتصفحات الأخرى تختار المجلد للعرض فقط، مع الحفظ عبر «تصدير».',
    folderPicked: 'تم اختيار المجلد: {name}',
    tasks: '{count} مهمة',
    footer: 'عارض نسخ Tasks.org — دون اتصال أولًا',
    openTasksOrg: 'زيارة الموقع',
    savedPin: 'تُحفظ التغييرات محليًا. استخدم «تصدير» لكتابة ملف.',
    kbdImport: 'Ctrl/Cmd+O — استيراد',
    kbdSave: 'Ctrl/Cmd+S — حفظ',
    aria: {
      menu: 'تبديل الشريط الجانبي',
      theme: 'تبديل المظهر',
      lang: 'تبديل اللغة',
      close: 'إغلاق',
      edit: 'تعديل المهمة',
      delete: 'حذف المهمة',
      collapse: 'طي المهام الفرعية',
      expand: 'توسيع المهام الفرعية',
      saveToFile: 'حفظ النسخة إلى ملف'
    }
  }
}

function lookup(table, key) {
  let node = table
  for (const part of key.split('.')) {
    if (node == null || typeof node !== 'object' || !(part in node)) return undefined
    node = node[part]
  }
  return node
}

export function tr(lang, key, vars) {
  let s = lookup(translations[lang], key)
  if (s === undefined) s = lookup(translations.en, key)
  if (s === undefined) s = key
  if (vars && typeof s === 'string') {
    for (const k of Object.keys(vars)) {
      s = s.split(`{${k}}`).join(String(vars[k]))
    }
  }
  return s
}

export function dirFor(lang) {
  return lang === 'ar' ? 'rtl' : 'ltr'
}
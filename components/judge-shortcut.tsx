import styles from "./judge-shortcut.module.css";

export function JudgeShortcut() {
  return (
    <a className={styles.shortcut} href="/judge" aria-label="Open DeepTrail judge demo launchpad">
      <span className={styles.dot} aria-hidden="true" />
      Judge demo
    </a>
  );
}

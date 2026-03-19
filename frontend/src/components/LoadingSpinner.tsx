import styles from "../styles/LoadingSpinner.module.css";

export default function LoadingSpinner() {
  return (
    <div className={styles.spinnerWrap}>
      <div className={styles.spinnerBg}></div>
      <div className={styles.spinnerRing}></div>
      <div className={styles.spinnerDotInner}></div>
    </div>
  );
}

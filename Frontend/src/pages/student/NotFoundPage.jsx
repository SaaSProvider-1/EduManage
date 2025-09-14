export default function NotFoundPage() {
  const styles = {
    page: {
      height: "100vh",
      width: "100%",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "20px",
    },
    container: {
      height: "100%",
      width: "100%",
      borderRadius: "1rem",
      backgroundColor: "#f9fafb",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      textAlign: "center",
    },
  };
  return (
    <>
      <div className="not-found-page" style={styles.page}>
        <div className="not-found-container" style={styles.container}>
          <h1>404: Page Not Found</h1>
          <p>The page you are looking for does not exist.</p>
        </div>
      </div>
    </>
  );
}

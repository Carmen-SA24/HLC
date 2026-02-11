// Animación de Pokebola con CSS. Admite estilos para usar como logo o carga.
import styles from "./Loader.module.css";

const Loader = ({
  className = "",
  style = {},
}: {
  className?: string;
  style?: React.CSSProperties;
}) => {
  return (
    <div className={`${styles.pokeball} ${className}`} style={style}></div>
  );
};

export default Loader;

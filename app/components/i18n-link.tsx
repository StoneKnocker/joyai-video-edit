import {
  Link as RouterLink,
  NavLink as RouterNavLink,
  useParams,
} from "react-router";
import { i18nConfig } from "~/lib/config";

type LinkProps = React.ComponentProps<typeof RouterLink> & {
  /**
   * 基础路径（不包含语言前缀）
   * 如果不包含语言前缀且是默认语言，将自动使用根路径
   * 例如："/", "/privacy-policy", "/contact" 等
   */
  to: string;

  /**
   * 可选，手动指定语言
   * 如果不提供，将自动从 URL 参数中检测当前语言
   */
  locale?: string;
};

type NavLinkProps = Omit<LinkProps, "to"> & {
  /**
   * 基础路径（不包含语言前缀）
   * 如果不包含语言前缀且是默认语言，将自动使用根路径
   * 例如："/", "/privacy-policy", "/contact" 等
   */
  to: string;

  /**
   * 可选，手动指定语言
   * 如果不提供，将自动从 URL 参数中检测当前语言
   */
  locale?: string;
};

/**
 * 国际化链接组件 - 直接替代 React Router 的 Link 组件
 *
 * 该组件完全兼容 React Router Link 的所有 props 和行为，
 * 并自动处理多语言路由前缀。
 *
 * @example
 * // 默认语言（en）自动生成 "/"
 * <Link to="/">Home</Link>
 *
 * @example
 * // 非默认语言自动生成 "/es/privacy-policy"
 * <Link to="/privacy-policy">Privacy Policy</Link>
 *
 * @example
 * // 手动指定语言（覆盖自动检测）
 * <Link to="/privacy-policy" locale="es">Política</Link>
 *
 * @example
 * // 使用所有 Link 属性（className, onClick 等）
 * <Link to="/about" className="text-primary" onClick={() => console.log('clicked')}>
 *   About
 * </Link>
 */
export function Link({ to, locale, ...props }: LinkProps) {
  const params = useParams();
  const currentLocale = locale || params.locale || i18nConfig.defaultLanguage;

  // 如果是默认语言，使用根路径；否则添加语言前缀
  const finalPath =
    currentLocale === i18nConfig.defaultLanguage
      ? to
      : `/${currentLocale}${to}`;

  return <RouterLink to={finalPath} {...props} />;
}

/**
 * 国际化导航链接组件 - 直接替代 React Router 的 NavLink 组件
 *
 * 该组件完全兼容 React Router NavLink 的所有 props 和行为，
 * 并自动处理多语言路由前缀，支持活动状态检测。
 *
 * @example
 * // 默认语言（en）自动生成 "/"
 * <NavLink to="/">Home</NavLink>
 *
 * @example
 * // 非默认语言自动生成 "/es/privacy-policy"
 * <NavLink to="/privacy-policy">Privacy Policy</NavLink>
 *
 * @example
 * // 手动指定语言（覆盖自动检测）
 * <NavLink to="/privacy-policy" locale="es">Política</NavLink>
 *
 * @example
 * // 使用活动状态样式
 * <NavLink
 *   to="/about"
 *   className={({ isActive }) => isActive ? "text-primary" : "text-secondary"}
 * >
 *   About
 * </NavLink>
 *
 * @example
 * // 使用所有 NavLink 属性
 * <NavLink to="/dashboard" end className="nav-link">
 *   Dashboard
 * </NavLink>
 */
export function NavLink({ to, locale, ...props }: NavLinkProps) {
  const params = useParams();
  const currentLocale = locale || params.locale || i18nConfig.defaultLanguage;

  // 如果是默认语言，使用根路径；否则添加语言前缀
  const finalPath =
    currentLocale === i18nConfig.defaultLanguage
      ? to
      : `/${currentLocale}${to}`;

  return <RouterNavLink to={finalPath} {...props} />;
}

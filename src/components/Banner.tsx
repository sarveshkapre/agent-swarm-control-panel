type BannerProps = {
  message: string;
  onDismiss: () => void;
};

export default function Banner({ message, onDismiss }: BannerProps) {
  return (
    <div className="banner" role="status">
      <span>{message}</span>
      <button className="ghost" onClick={onDismiss}>
        Dismiss
      </button>
    </div>
  );
}

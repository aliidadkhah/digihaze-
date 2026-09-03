          {cartToast && (
            <div className="cart-toast" role="status">
              <span className="cart-toast-text">
                «{cartToast.name}» به سبد خرید اضافه شد
              </span>

              <Link
                href="/cart"
                className="cart-toast-link"
                onClick={() => setCartToast(null)}
                style={{
                  background: "#22E5C9",
                  color: "#0b0b17",
                }}
              >
                رفتن به سبد خرید
              </Link>

              <style jsx>{`
                .cart-toast {
                  position: fixed;
                  bottom: 20px;
                  left: 50%;
                  transform: translateX(-50%);
                  z-index: 10000;
                  background: var(--surface, #1a1a2e);
                  border: 1px solid var(--surface2, #2a2a3e);
                  border-radius: 12px;
                  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.3);
                  padding: 12px 16px;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  gap: 8px;
                  max-width: 90vw;
                  animation: cart-toast-in 0.18s ease-out;
                }

                .cart-toast-text {
                  font-family: Vazirmatn, sans-serif;
                  font-size: 13.5px;
                  font-weight: 600;
                  color: var(--text-hi, #fff);
                  white-space: nowrap;
                  overflow: hidden;
                  text-overflow: ellipsis;
                  max-width: 80vw;
                }

                .cart-toast-link {
                  font-family: Vazirmatn, sans-serif;
                  font-size: 13px;
                  font-weight: 800 !important;
                  text-decoration: none !important;
                  padding: 5px 16px;
                  border-radius: 999px;
                  display: inline-block;
                }

                .cart-toast-link:hover {
                  opacity: 0.88;
                }

                @keyframes cart-toast-in {
                  from {
                    opacity: 0;
                    transform: translateX(-50%) translateY(8px);
                  }
                  to {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                  }
                }
              `}</style>
            </div>
          )}

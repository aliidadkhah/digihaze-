<div
  style={{
    display: "flex",
    flexDirection: "column",
    gap: 14,
    marginBottom: 26,
  }}
>
  {cart.map((item) => {
    const product = item.product;
    const price = discountedPrice(product);

    return (
      <div
        key={product.id}
        style={{
          display: "flex",
          gap: 14,
          background: "var(--surface)",
          border: "1px solid var(--surface2)",
          borderRadius: 16,
          padding: 12,
          alignItems: "center",
        }}
      >

        <Link
          href={`/product/${product.id}`}
          style={{
            flexShrink: 0,
            textDecoration: "none",
          }}
        >
          <img
            src={product.images?.[0]}
            alt={product.name}
            style={{
              width: 76,
              height: 76,
              borderRadius: 12,
              objectFit: "cover",
              display: "block",
            }}
          />
        </Link>

        <div style={{ flex: 1 }}>
          <div
            style={{
              fontWeight: 700,
              fontSize: 14,
              marginBottom: 6,
            }}
          >
            {product.name}
          </div>

          <div
            style={{
              color: "var(--text-mut)",
              fontSize: 13,
            }}
          >
            {money(price)}
          </div>
        </div>


        <div
          style={{
            display: "flex",
            alignItems: "center",
            border: "1px solid var(--surface2)",
            borderRadius: 10,
            overflow: "hidden",
          }}
        >
          <button
            onClick={() =>
              updateQty(product.id, item.qty + 1)
            }
            style={qtyBtnStyle}
          >
            <Plus size={13} />
          </button>

          <span
            style={{
              width: 32,
              textAlign: "center",
              fontWeight: 700,
            }}
          >
            {item.qty}
          </span>

          <button
            onClick={() =>
              updateQty(product.id, item.qty - 1)
            }
            style={qtyBtnStyle}
          >
            <Minus size={13} />
          </button>
        </div>


        <button
          onClick={() => removeItem(product.id)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          <Trash2 size={18} color="#2F86FF" />
        </button>

      </div>
    );
  })}
</div>

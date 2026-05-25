"""
PDF generation service using Jinja2 templates.
WeasyPrint is used when available; falls back to raw HTML bytes.
"""

from datetime import datetime
from decimal import Decimal
import logging

logger = logging.getLogger(__name__)

ORDER_TEMPLATE = """<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
  h1 { color: #2d5a1b; }
  table { width: 100%; border-collapse: collapse; margin-top: 20px; }
  th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
  th { background: #f0f8e8; }
  .total { font-weight: bold; font-size: 1.1em; }
  .footer { margin-top: 40px; font-size: 0.85em; color: #888; }
</style>
</head>
<body>
  <h1>AgroHub Logistic — Счёт №{{ order_id }}</h1>
  <p><strong>Дата:</strong> {{ date }}</p>
  <p><strong>Статус:</strong> {{ status }}</p>

  <table>
    <thead>
      <tr><th>Товар</th><th>Ед.</th><th>Кол-во</th><th>Цена за ед.</th><th>Сумма</th></tr>
    </thead>
    <tbody>
    {% for item in items %}
      <tr>
        <td>{{ item.product_name }}</td>
        <td>{{ item.unit }}</td>
        <td>{{ item.quantity }}</td>
        <td>{{ item.unit_price }} ₽</td>
        <td>{{ item.total_price }} ₽</td>
      </tr>
    {% endfor %}
    </tbody>
    <tfoot>
      <tr class="total">
        <td colspan="4">Итого</td>
        <td>{{ total_amount }} ₽</td>
      </tr>
    </tfoot>
  </table>

  <div class="footer">Документ сформирован {{ date }}. AgroHub Logistic Platform.</div>
</body>
</html>
"""


def render_order_pdf(order, items: list[dict]) -> bytes:
    """Render order as PDF. Returns PDF bytes or HTML bytes as fallback."""
    from jinja2 import Template

    tpl = Template(ORDER_TEMPLATE)
    html = tpl.render(
        order_id=order.id,
        date=datetime.now().strftime("%d.%m.%Y %H:%M"),
        status=order.status,
        items=items,
        total_amount=order.total_amount,
    )

    try:
        from weasyprint import HTML
        pdf_bytes = HTML(string=html).write_pdf()
        return pdf_bytes
    except Exception as e:
        logger.warning(f"WeasyPrint unavailable ({e}), returning HTML")
        return html.encode("utf-8")

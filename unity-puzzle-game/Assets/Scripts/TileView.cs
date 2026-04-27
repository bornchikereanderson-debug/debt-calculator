using System.Collections;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

[RequireComponent(typeof(RectTransform))]
[RequireComponent(typeof(CanvasGroup))]
[RequireComponent(typeof(Image))]
public class TileView : MonoBehaviour, IPointerClickHandler
{
    [SerializeField] private float moveDuration = 0.14f;
    [SerializeField] private float removeDuration = 0.16f;
    [SerializeField] private float invalidPulseDuration = 0.12f;

    private BoardController board;
    private RectTransform rectTransform;
    private CanvasGroup canvasGroup;
    private Image image;
    private Coroutine animationRoutine;

    public int Column { get; private set; }
    public int Row { get; private set; }
    public TileColorId ColorId { get; private set; }

    private void Awake()
    {
        rectTransform = GetComponent<RectTransform>();
        canvasGroup = GetComponent<CanvasGroup>();
        image = GetComponent<Image>();
    }

    public void Initialize(BoardController owner, int column, int row, TileColorId colorId, Vector2 size, Sprite sprite)
    {
        board = owner;
        rectTransform.sizeDelta = size;
        image.sprite = sprite;
        image.type = Image.Type.Simple;
        image.raycastTarget = true;

        SetGridPosition(column, row);
        SetColor(colorId, board.GetTileColor(colorId));
        ResetVisualState();
    }

    public void SetGridPosition(int column, int row)
    {
        Column = column;
        Row = row;
        gameObject.name = $"Tile_{column}_{row}_{ColorId}";
    }

    public void SetColor(TileColorId colorId, Color color)
    {
        ColorId = colorId;
        image.color = color;
        gameObject.name = $"Tile_{Column}_{Row}_{ColorId}";
    }

    public void SetAnchoredPositionImmediate(Vector2 position)
    {
        rectTransform.anchoredPosition = position;
    }

    public IEnumerator AnimateMove(Vector2 targetPosition)
    {
        yield return AnimateAnchoredPosition(targetPosition, moveDuration);
    }

    public IEnumerator AnimateSpawn(Vector2 startPosition, Vector2 targetPosition)
    {
        rectTransform.anchoredPosition = startPosition;
        rectTransform.localScale = Vector3.one * 0.96f;
        canvasGroup.alpha = 0f;

        float elapsed = 0f;
        while (elapsed < moveDuration)
        {
            elapsed += Time.deltaTime;
            float t = Mathf.Clamp01(elapsed / moveDuration);
            float eased = 1f - Mathf.Pow(1f - t, 3f);
            rectTransform.anchoredPosition = Vector2.LerpUnclamped(startPosition, targetPosition, eased);
            rectTransform.localScale = Vector3.LerpUnclamped(Vector3.one * 0.96f, Vector3.one, eased);
            canvasGroup.alpha = Mathf.LerpUnclamped(0f, 1f, eased);
            yield return null;
        }

        rectTransform.anchoredPosition = targetPosition;
        rectTransform.localScale = Vector3.one;
        canvasGroup.alpha = 1f;
    }

    public IEnumerator AnimateRemove()
    {
        Vector3 initialScale = rectTransform.localScale;
        float elapsed = 0f;
        while (elapsed < removeDuration)
        {
            elapsed += Time.deltaTime;
            float t = Mathf.Clamp01(elapsed / removeDuration);
            float eased = 1f - Mathf.Pow(1f - t, 3f);
            rectTransform.localScale = Vector3.LerpUnclamped(initialScale, Vector3.zero, eased);
            canvasGroup.alpha = Mathf.LerpUnclamped(1f, 0f, eased);
            yield return null;
        }

        rectTransform.localScale = Vector3.zero;
        canvasGroup.alpha = 0f;
    }

    public void PlayInvalidPulse()
    {
        if (animationRoutine != null)
        {
            StopCoroutine(animationRoutine);
        }

        animationRoutine = StartCoroutine(InvalidPulseRoutine());
    }

    public void ResetVisualState()
    {
        if (animationRoutine != null)
        {
            StopCoroutine(animationRoutine);
            animationRoutine = null;
        }

        rectTransform.localScale = Vector3.one;
        canvasGroup.alpha = 1f;
    }

    public void OnPointerClick(PointerEventData eventData)
    {
        if (board != null)
        {
            board.HandleTilePressed(this);
        }
    }

    private IEnumerator InvalidPulseRoutine()
    {
        Vector3 start = Vector3.one;
        Vector3 peak = Vector3.one * 1.1f;
        float elapsed = 0f;

        while (elapsed < invalidPulseDuration)
        {
            elapsed += Time.deltaTime;
            float t = Mathf.Clamp01(elapsed / invalidPulseDuration);
            rectTransform.localScale = Vector3.LerpUnclamped(start, peak, t);
            yield return null;
        }

        elapsed = 0f;
        while (elapsed < invalidPulseDuration)
        {
            elapsed += Time.deltaTime;
            float t = Mathf.Clamp01(elapsed / invalidPulseDuration);
            rectTransform.localScale = Vector3.LerpUnclamped(peak, start, t);
            yield return null;
        }

        rectTransform.localScale = Vector3.one;
        animationRoutine = null;
    }

    private IEnumerator AnimateAnchoredPosition(Vector2 targetPosition, float duration)
    {
        Vector2 startPosition = rectTransform.anchoredPosition;
        float elapsed = 0f;

        while (elapsed < duration)
        {
            elapsed += Time.deltaTime;
            float t = Mathf.Clamp01(elapsed / duration);
            float eased = 1f - Mathf.Pow(1f - t, 3f);
            rectTransform.anchoredPosition = Vector2.LerpUnclamped(startPosition, targetPosition, eased);
            yield return null;
        }

        rectTransform.anchoredPosition = targetPosition;
    }
}

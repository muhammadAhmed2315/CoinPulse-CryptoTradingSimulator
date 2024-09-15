class NewsArticle:
    """Class for storing information about a news article"""

    def __init__(
        self,
        title: str,
        url: str,
        timestamp: str,
        description: str,
        publisher: str,
    ):
        """
        Initialises the NewsArticle object

        Parameters:
        title: Article title
        url: URL of article
        timestamp: Date and time the article was published in the format "X hours/days ago"
        description: First 150 characters of the article
        publisher: Name of the publisher of the article
        """
        self.title = title
        self.url = url
        self.timestamp = timestamp
        self.description = description
        self.publisher = publisher

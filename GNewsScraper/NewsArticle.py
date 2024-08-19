class NewsArticle:
    """Class for storing information about a news article"""

    def __init__(
        self, title: str, url: str, date: str, publisher: str, publisher_url: str
    ):
        """
        Initialises the NewsArticle object

        Parameters:
        title: Article title
        url: URL of article
        date: Date and time the article was published in the format DD-MM-YYYY HH:MM:SS
        publisher: Name of the publisher of the article
        publisher_url: URL of the website of the article's publisher
        """
        self.title = title
        self.url = url
        self.date = date
        self.publisher = publisher
        self.publisher_url = publisher_url

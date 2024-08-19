import requests
import urllib.parse
from bs4 import BeautifulSoup
from datetime import datetime
from constants import COUNTRY_CODES
from NewsArticle import NewsArticle
from goose3 import Goose


class GNewsScraper:

    def __init__(self):
        self.base_url = "https://news.google.com/rss/search"
        self.excluded_publishers = set()  # Excluding by URL

    def search(
        self,
        query,
        country="united_kingdom",
        max_results=100,
    ):
        # Add search query to URL
        url_encoded_query = urllib.parse.quote(query)
        url = self.base_url + f"?q={url_encoded_query}"

        # Add country code to URL
        country_code = "GB" if country not in COUNTRY_CODES else COUNTRY_CODES[country]
        url += f"&hl=en-{country_code}&gl={country_code}"

        # Get page and pass to BeautifulSoup
        gnews_page = requests.get(url).text
        doc = BeautifulSoup(gnews_page, "lxml-xml")
        items = doc.find_all("item")

        # Get time RSS feed was generated
        date_generated = GNewsScraper.convert_date_time(doc.channel.lastBuildDate)

        # Convert all items into NewsArticle objects
        articles = []
        for item in items:
            if item.source["url"] not in self.excluded_publishers:
                # Remove " - publisher" from end of title
                title_text = item.title.text
                title_text = " - ".join(title_text.split(" - ")[:-1])

                # Convert time
                published_date = GNewsScraper.convert_date_time(item.pubDate.text)

                articles.append(
                    NewsArticle(
                        title=title_text,
                        url=item.link.text,
                        date=published_date,
                        publisher=item.source.text,
                        publisher_url=item.source["url"],
                    )
                )

        # Limit number of articles if necessary
        if 1 <= max_results <= 100:
            articles = articles[: max_results + 1]

        return articles, date_generated

    def add_excluded_publishers(self, urls):
        for url in urls:
            self.excluded_publishers.add(url.lower())

    def remove_excluded_publishers(self, urls):
        for url in urls:
            self.excluded_publishers.discard(url.lower())

    @staticmethod
    def convert_date_time(date_time):
        date_obj = datetime.strptime(date_time, "%a, %d %b %Y %H:%M:%S GMT")
        return date_obj.strftime("%d-%m-%Y %H:%M:%S")

    @staticmethod
    def get_article_text(url):
        g = Goose()
        article = g.extract(url=url)
        return article.meta_description + article.cleaned_text

import { MainLayout } from '@/components/layout/MainLayout';
import { HomeHero } from '@/components/home/HomeHero';
import { HomeSearch } from '@/components/home/HomeSearch';
import { HomeCaminhos } from '@/components/home/HomeCaminhos';
import { HomeComoFunciona } from '@/components/home/HomeComoFunciona';
import { HomeConfianca } from '@/components/home/HomeConfianca';
import { HomeCtaFinal } from '@/components/home/HomeCtaFinal';
import { HomeStyles } from '@/components/home/HomeStyles';

export default function Home() {
  return (
    <MainLayout>
      <div className="nm-home">
        <HomeStyles />
        <div className="nm-wrap">
          <HomeHero>
            <HomeSearch />
          </HomeHero>
          <HomeCaminhos />
          <HomeComoFunciona />
          <HomeConfianca />
          <HomeCtaFinal />
        </div>
      </div>
    </MainLayout>
  );
}
